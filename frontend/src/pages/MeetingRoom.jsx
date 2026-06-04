import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LiveKitRoom, VideoConference, useParticipants } from '@livekit/components-react';
import {
  CheckSquare,
  Grid3X3,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  Users,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  ClipboardList
} from 'lucide-react';
import InterviewEvaluationPanel from '../components/InterviewEvaluationPanel';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, Button, Modal, EmptyState } from '../components/ui';
import { KEYS, apiPut, asyncGet, asyncSet } from '../services/storage';
import { getMeetingJoinToken, markMeetingJoined, markMeetingLeft, getMeetingChat, postMeetingChat } from '../services/meetings';
import { saveStandupRecord } from '../services/standup';
import { getMeetingDateTime } from '../utils/dates';

export default function MeetingRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/meetings');
    }
  };
  const [meeting, setMeeting] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [roomConfig, setRoomConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);
  const [sidePanel, setSidePanel] = useState('participants');
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [dynamicStandupInputs, setDynamicStandupInputs] = useState({});
  const [message, setMessage] = useState('');
  const [chatLogs, setChatLogs] = useState([]);
  const [mentionNotifications, setMentionNotifications] = useState([]);
  const [unreadMentionCount, setUnreadMentionCount] = useState(0);
  const [standupData, setStandupData] = useState({});
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [initialMedia, setInitialMedia] = useState({ audio: false, video: false });
  const [roomConnect, setRoomConnect] = useState(true);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedMentionIdx, setSelectedMentionIdx] = useState(0);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    assigneeIds: [],
    projectId: '',
    priority: 'medium',
    dueDate: ''
  });
  const joinedRef = useRef(false);
  const hasRequestedTokenRef = useRef(false);
  const previousWaitingCount = useRef(0);
  const audioRef = useRef(null);
  const previousChatCount = useRef(0);
  const chatAudioRef = useRef(null);
  const mentionAudioRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    let pollInterval = null;
    let chatPollInterval = null;

    const fetchMeetingData = async () => {
      const allMeetings = await asyncGet(KEYS.MEETINGS);
      return (allMeetings || []).find(item => item.id === id);
    };

    const checkWaitingRoomStatus = async (m) => {
      if (cancelled) return;

      const isHost = m.hostId === currentUser.id;
      const isAdmin = currentUser.role === 'admin';
      // Admin and host bypass the waiting room entirely
      const hasHostStartedMeeting = toArray(m.attendanceLogs).some(l => l.userId === m.hostId);

      if (!isHost && !isAdmin && !hasHostStartedMeeting) {
        return;
      }

      const meetingTime = getMeetingDateTime(m);
      const minutesLate = (new Date() - meetingTime) / 60000;

      let requiresApproval = false;
      if (!isAdmin && !isHost) {
        if (['employee', 'hr', 'manager'].includes(currentUser.role)) {
          requiresApproval = minutesLate > 5;
        } else if (currentUser.role === 'intern') {
          requiresApproval = minutesLate > 2;
        } else {
          requiresApproval = true;
        }
      }

      const waitingRoom = toArray(m.waitingRoom);
      const myWaitStatus = waitingRoom.find(w => w.userId === currentUser.id)?.status;

      if (requiresApproval && myWaitStatus !== 'approved') {
        if (myWaitStatus !== 'waiting' && myWaitStatus !== 'rejected') {
          const updatedWait = [...waitingRoom, { userId: currentUser.id, status: 'waiting', timestamp: new Date().toISOString() }];
          const updatedMeeting = { ...m, waitingRoom: updatedWait };
          setMeeting(updatedMeeting);
          await apiPut(KEYS.MEETINGS, id, updatedMeeting);
        }
      } else {
        if (!hasRequestedTokenRef.current) {
          hasRequestedTokenRef.current = true;
          try {
            const tokenResponse = await getMeetingJoinToken(id, currentUser);
            if (!cancelled) setRoomConfig(tokenResponse);
          } catch (err) {
            setError(err?.response?.data?.message || 'Failed to get room token');
          }
        }
      }
    };

    const loadRoom = async () => {
      try {
        const [foundMeeting, allUsers, allProjects] = await Promise.all([
          fetchMeetingData(),
          asyncGet(KEYS.USERS),
          asyncGet(KEYS.PROJECTS)
        ]);

        if (!foundMeeting) {
          handleGoBack();
          return;
        }
        if (foundMeeting.status === 'completed' || foundMeeting.endedByHost) {
          navigate(`/meetings/${id}`, { state: { endedByHost: true } });
          return;
        }
        if (foundMeeting.meetingMode === 'external') {
          setError('This meeting uses an external link. Open it from the meeting details page.');
          setLoading(false);
          return;
        }

        setUsers(allUsers || []);
        setProjects(allProjects || []);
        setMeeting(foundMeeting);
        setChatLogs(toArray(foundMeeting.chatLogs));

        await checkWaitingRoomStatus(foundMeeting);
      } catch (err) {
        const message = err?.response?.data?.message || 'Unable to join this meeting room.';
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRoom();

    pollInterval = setInterval(async () => {
      if (cancelled) return;
      try {
        const m = await fetchMeetingData();
        if (m) {
          if (m.status === 'completed' || m.endedByHost) {
            navigate(`/meetings/${id}`, { state: { endedByHost: true } });
            return;
          }
          setMeeting(m);
          await checkWaitingRoomStatus(m);
        }
      } catch (e) { }
    }, 3000);

    chatPollInterval = setInterval(async () => {
      if (cancelled) return;
      try {
        const logs = await getMeetingChat(id);
        if (logs) {
          setChatLogs(logs);
        }
      } catch (e) { }
    }, 1000);

    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
      if (chatPollInterval) clearInterval(chatPollInterval);
      if (joinedRef.current && currentUser?.id) {
        markMeetingLeft(id, currentUser.id);
      }

      if (currentUser?.id) {
        asyncGet(KEYS.MEETINGS).then(meetings => {
          const m = (meetings || []).find(item => item.id === id);
          if (m && m.hostId !== currentUser.id) {
            const waitingRoom = toArray(m.waitingRoom);
            if (waitingRoom.some(w => w.userId === currentUser.id)) {
              const updatedWait = waitingRoom.filter(w => w.userId !== currentUser.id);
              apiPut(KEYS.MEETINGS, id, { ...m, waitingRoom: updatedWait });
            }
          }
        }).catch(() => { });
      }
    };
  }, [currentUser, id, navigate]);

  const activeUserIds = toArray(meeting?.attendanceLogs)
    .filter(log => !log.leaveTime)
    .map(log => log.userId);

  const participants = [...new Set(activeUserIds)]
    .map(userId => users.find(user => user.id === userId))
    .filter(Boolean);
  const presentParticipants = onlineUsers.length > 0
    ? participants.filter(user => onlineUsers.includes(user.id))
    : participants;
  const presentParticipantIds = presentParticipants.map(user => user.id);

  const isHost = meeting?.hostId === currentUser.id;
  const mentionSuggestions = mentionQuery !== null ? getMentionSuggestions(mentionQuery, presentParticipants) : [];

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/universfield-new-notification-051-494246.mp3');
    }
    if (!chatAudioRef.current) {
      chatAudioRef.current = new Audio('/koiroylers-live-chat-353605.mp3');
    }
    if (!mentionAudioRef.current) {
      mentionAudioRef.current = new Audio('/liecio-message-alert-190042.mp3');
    }
  }, []);

  useEffect(() => {
    if (meeting && isHost) {
      const currentWaitingCount = toArray(meeting.waitingRoom).filter(w => w.status === 'waiting').length;
      if (currentWaitingCount > previousWaitingCount.current) {
        if (audioRef.current) {
          audioRef.current.play().catch(e => console.warn('Audio blocked', e));
        }
      }
      previousWaitingCount.current = currentWaitingCount;
    }
  }, [meeting, isHost]);

  useEffect(() => {
    const currentChatCount = chatLogs.length;
    if (currentChatCount > previousChatCount.current && previousChatCount.current > 0) {
      const newMessages = chatLogs.slice(previousChatCount.current);
      let shouldPlayNormalSound = false;
      let shouldPlayMentionSound = false;
      const nextMentionNotifications = [];

      newMessages.forEach(msg => {
        const senderId = msg?.userId || msg?.senderId;
        if (senderId !== currentUser.id) {
          const mentions = toArray(msg.mentions);
          const wasMentioned = mentions.includes(currentUser.id);
          if (wasMentioned) {
            const sender = users.find(user => user.id === senderId);
            shouldPlayMentionSound = true;
            nextMentionNotifications.push({
              id: msg.id || `${msg.timestamp}-${senderId}`,
              senderName: sender?.name || 'Someone',
              text: msg.text || '',
              timestamp: msg.timestamp,
              isAllMention: /(^|\s)@all\b/i.test(msg?.text || '')
            });
          } else {
            shouldPlayNormalSound = true;
          }
        }
      });

      if (nextMentionNotifications.length > 0) {
        window.setTimeout(() => {
          setMentionNotifications(prev => [...nextMentionNotifications, ...prev].slice(0, 5));
          if (sidePanel !== 'chat') {
            setUnreadMentionCount(prev => prev + nextMentionNotifications.length);
          }
        }, 0);
      }

      if (shouldPlayMentionSound && mentionAudioRef.current) {
        mentionAudioRef.current.play().catch(e => console.warn('Mention audio blocked', e));
      } else if (shouldPlayNormalSound && chatAudioRef.current) {
        chatAudioRef.current.play().catch(e => console.warn('Chat audio blocked', e));
      }
    }
    previousChatCount.current = currentChatCount;
  }, [chatLogs, currentUser.id, sidePanel, users]);

  const handlePermitAll = async () => {
    const updatedWait = toArray(meeting.waitingRoom).map(w => w.status === 'waiting' ? { ...w, status: 'approved' } : w);
    const updatedMeeting = { ...meeting, waitingRoom: updatedWait };
    setMeeting(updatedMeeting);
    await apiPut(KEYS.MEETINGS, id, updatedMeeting);
    toast.success('All pending requests approved');
  };

  const handleWaitingRoomAction = async (userId, status) => {
    const updatedWait = toArray(meeting.waitingRoom).map(w => w.userId === userId ? { ...w, status } : w);
    const updatedMeeting = { ...meeting, waitingRoom: updatedWait };
    setMeeting(updatedMeeting);
    await apiPut(KEYS.MEETINGS, id, updatedMeeting);
    toast.success(status === 'approved' ? 'Allowed into meeting' : 'Denied entry');
  };

  const handleLeaveWaitingRoom = async () => {
    if (meeting) {
      const updatedWait = toArray(meeting.waitingRoom).filter(w => w.userId !== currentUser.id);
      if (updatedWait.length !== toArray(meeting.waitingRoom).length) {
        const updatedMeeting = { ...meeting, waitingRoom: updatedWait };
        setMeeting(updatedMeeting);
        await apiPut(KEYS.MEETINGS, id, updatedMeeting);
      }
    }
    handleGoBack();
  };

  const handleRequestAgain = async () => {
    const updatedWait = toArray(meeting.waitingRoom).filter(w => w.userId !== currentUser.id);
    updatedWait.push({ userId: currentUser.id, status: 'waiting', timestamp: new Date().toISOString() });
    const updatedMeeting = { ...meeting, waitingRoom: updatedWait };
    setMeeting(updatedMeeting);
    await apiPut(KEYS.MEETINGS, id, updatedMeeting);
  };

  const handleConnected = useCallback(() => {
    if (joinedRef.current) return;
    joinedRef.current = true;
    markMeetingJoined(id, currentUser.id);
  }, [currentUser.id, id]);

  const handleDisconnected = useCallback(async () => {
    if (joinedRef.current) {
      setRoomConnect(false);
      setShowLeaveModal(true);
    }
  }, []);

  const confirmLeave = async () => {
    setShowLeaveModal(false);
    joinedRef.current = false;
    markMeetingLeft(id, currentUser.id);
    handleGoBack();
  };

  const handleEndMeeting = async () => {
    if (!meeting || !isHost) return;
    try {
      const updatedMeeting = { ...meeting, status: 'completed', endedByHost: true };
      setMeeting(updatedMeeting);
      await apiPut(KEYS.MEETINGS, id, updatedMeeting);
      navigate(`/meetings/${id}`, { state: { endedByHost: true } });
    } catch (err) {
      toast.error('Failed to end meeting');
    }
  };

  const cancelLeave = () => {
    setInitialMedia({ audio: false, video: false });
    setRoomConnect(true);
    setShowLeaveModal(false);
  };

  const handleActiveParticipantsChange = useCallback((users) => {
    setOnlineUsers(users);
  }, []);

  const handleMentionSelect = (mentionTarget) => {
    const mentionName = mentionTarget.id === '__all__' ? 'all' : mentionTarget.name.replace(/\s+/g, '');
    setMessage(prev => prev.slice(0, prev.lastIndexOf('@')) + `@${mentionName} `);
    setMentionQuery(null);
  };

  const sendMessage = async () => {
    if (!message.trim() || !meeting) return;

    const trimmedMessage = message.trim();
    const mentionRegex = /@(\w+)/g;
    const rawMentions = trimmedMessage.match(mentionRegex) || [];
    const mentionedUserIds = [];
    const hasAllMention = /(^|\s)@all\b/i.test(trimmedMessage);

    if (hasAllMention) {
      presentParticipantIds.forEach(userId => {
        if (userId !== currentUser.id && !mentionedUserIds.includes(userId)) {
          mentionedUserIds.push(userId);
        }
      });
    }

    rawMentions.forEach(mention => {
      const name = mention.substring(1).toLowerCase();
      if (name === 'all') return;
      const user = presentParticipants.find(u => u.name.replace(/\s+/g, '').toLowerCase() === name);
      if (user && !mentionedUserIds.includes(user.id)) {
        mentionedUserIds.push(user.id);
      }
    });

    presentParticipants.forEach(u => {
      if (trimmedMessage.toLowerCase().includes(`@${u.name}`.toLowerCase()) && !mentionedUserIds.includes(u.id)) {
        mentionedUserIds.push(u.id);
      }
    });

    const mentions = mentionedUserIds;

    const newMsg = {
      id: uuidv4(),
      userId: currentUser.id,
      senderId: currentUser.id,
      text: trimmedMessage,
      mentions: mentions,
      timestamp: new Date().toISOString()
    };

    // Optimistic update
    setChatLogs(prev => [...prev, newMsg]);
    setMessage('');

    try {
      const updatedLogs = await postMeetingChat(id, newMsg);
      if (updatedLogs) {
        setChatLogs(updatedLogs);
      }
    } catch (e) {
      toast.error('Failed to send message');
    }
  };

  const handleAddStandupInput = (userId) => {
    const currentInputs = dynamicStandupInputs[userId] || [''];
    setDynamicStandupInputs({ ...dynamicStandupInputs, [userId]: [...currentInputs, ''] });
  };

  const handleStandupInputChange = (userId, index, value) => {
    const currentInputs = dynamicStandupInputs[userId] || [''];
    const newInputs = [...currentInputs];
    newInputs[index] = value;
    setDynamicStandupInputs({ ...dynamicStandupInputs, [userId]: newInputs });
  };

  const handleSubmitStandup = async (participantId) => {
    const inputs = dynamicStandupInputs[participantId] || [];
    const validInputs = inputs.filter(i => i.trim() !== '');
    if (validInputs.length === 0) {
      toast.error('Please fill in at least one task');
      return;
    }

    try {
      const participant = participants.find(p => p.id === participantId);
      const participantName = participant ? participant.name : 'Unknown';
      const qna = validInputs.map((task, idx) => `Task ${idx + 1}: ${task}`).join('\n');
      
      const record = {
        userId: participantId,
        userName: participantName,
        meetingType: meeting.standupType === 'evening' ? 'Evening' : 'Morning',
        meetingDate: new Date().toISOString().split('T')[0],
        submissionTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
        questionsAndAnswers: qna,
        status: 'Submitted'
      };

      await saveStandupRecord(record);
      toast.success('Standup records saved successfully');
      setDynamicStandupInputs({ ...dynamicStandupInputs, [participantId]: [''] }); // reset
    } catch (err) {
      toast.error('Failed to save standup records');
    }
  };

  const handleAssignTask = async (participantId) => {
    if (!taskForm.title) {
      toast.error('Task title is required');
      return;
    }
    const newTask = {
      id: uuidv4(),
      projectId: meeting.projectId || taskForm.projectId || '',
      milestoneId: null,
      sprintId: null,
      ...taskForm,
      assigneeIds: [participantId],
      creatorId: currentUser.id,
      assignedBy: currentUser.id,
      status: 'todo',
      startDate: new Date().toISOString().split('T')[0],
      attachments: [],
      comments: [],
      activityLog: [],
      delayReason: '',
      newDueDate: null,
      isDelayed: false,
      createdAt: new Date().toISOString(),
      tags: []
    };
    const tasks = await asyncGet(KEYS.TASKS) || [];
    await asyncSet(KEYS.TASKS, [...tasks, newTask]);

    const assignedIds = [...toArray(meeting.taskAssignedInMeeting), newTask.id];
    const updatedMeeting = { ...meeting, taskAssignedInMeeting: assignedIds };
    setMeeting(updatedMeeting);
    await apiPut(KEYS.MEETINGS, id, updatedMeeting);
    setTaskForm({ title: '', description: '', assigneeIds: [], projectId: '', priority: 'medium', dueDate: '' });
    toast.success('Task assigned to participant');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center text-primary-500">
          <Loader2 className="mb-4 h-8 w-8 animate-spin" />
          <p className="text-sm text-gray-300">Joining meeting room...</p>
        </div>
      </div>
    );
  }

  const isHostNow = meeting?.hostId === currentUser.id;
  const isAdminNow = currentUser.role === 'admin';

  const hasHostStartedMeetingNow = toArray(meeting?.attendanceLogs).some(l => l.userId === meeting?.hostId);

  if (!isHostNow && !isAdminNow && !hasHostStartedMeetingNow) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="max-w-md rounded-lg border border-gray-800 bg-gray-900 p-6 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-950 text-blue-500">
            <Clock size={24} />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-100">Waiting for Host</h2>
          <p className="mb-6 text-sm text-gray-400">The meeting will begin shortly. Please wait for the host to start the session.</p>
          <Button onClick={handleGoBack} variant="secondary" className="w-full justify-center">
            Back to Meetings
          </Button>
        </div>
      </div>
    );
  }

  const meetingTimeNow = meeting ? getMeetingDateTime(meeting) : new Date();
  const minutesLateNow = (new Date() - meetingTimeNow) / 60000;

  let requiresApproval = false;
  if (!isAdminNow && !isHostNow) {
    if (['employee', 'hr', 'manager'].includes(currentUser.role)) {
      requiresApproval = minutesLateNow > 5;
    } else if (currentUser.role === 'intern') {
      requiresApproval = minutesLateNow > 2;
    } else {
      requiresApproval = true;
    }
  }

  const myWaitStatus = toArray(meeting?.waitingRoom).find(w => w.userId === currentUser.id)?.status;

  if (requiresApproval && myWaitStatus !== 'approved') {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="max-w-md rounded-lg border border-gray-800 bg-gray-900 p-6 text-center shadow-xl">
          {myWaitStatus === 'rejected' ? (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-950 text-red-500">
                <X size={24} />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-gray-100">Join Request Denied</h2>
              <p className="mb-6 text-sm text-gray-400">The host has denied your request to join this meeting.</p>
              <div className="flex flex-col gap-3">
                <Button onClick={handleRequestAgain} variant="primary" className="w-full justify-center">
                  Request Again
                </Button>
                <Button onClick={handleGoBack} variant="secondary" className="w-full justify-center">
                  Back to Meetings
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-950 text-primary-500">
                <Loader2 size={24} className="animate-spin" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-gray-100">Waiting for Host</h2>
              <p className="mb-6 text-sm text-gray-400">You are in the waiting room. Please wait for the host to let you in.</p>
              <Button onClick={handleLeaveWaitingRoom} variant="secondary" className="w-full justify-center">
                Leave Waiting Room
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (error || !roomConfig) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="max-w-md rounded-lg border border-gray-800 bg-gray-900 p-6 text-center shadow-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-950 text-red-500">
            <X size={24} />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-gray-100">Unable to join</h2>
          <p className="mb-6 text-sm text-gray-400">{error || 'Failed to get meeting room configuration.'}</p>
          <Button onClick={handleGoBack} variant="primary" className="w-full justify-center">
            Back to Meetings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950">
      {connectionError && (
        <div className="fixed left-1/2 top-4 z-[150] w-[min(92vw,520px)] -translate-x-1/2 rounded-lg border border-red-800 bg-red-950/95 p-4 shadow-xl">
          <h2 className="text-sm font-semibold text-red-100">Meeting media server is unreachable</h2>
          <p className="mt-1 text-xs leading-5 text-red-200">{connectionError}</p>
        </div>
      )}
      <div className={`h-full relative ${panelOpen ? 'md:mr-[400px]' : ''}`}>
        <LiveKitRoom
          token={roomConfig.token}
          serverUrl={roomConfig.url}
          connect={roomConnect}
          audio={initialMedia.audio}
          video={initialMedia.video}
          onConnected={handleConnected}
          onDisconnected={handleDisconnected}
          onError={() => {
            setConnectionError(`The browser could not connect to ${roomConfig.url}. Start LiveKit on port 7880 or update LIVEKIT_URL to the reachable LiveKit WebSocket URL.`);
          }}
          data-lk-theme="default"
          className="h-full"
        >
          <ActiveParticipantsTracker onActiveParticipantsChange={handleActiveParticipantsChange} />
          <VideoConference />
        </LiveKitRoom>
      </div>

      <div className="fixed left-3 top-3 z-[130] flex items-center gap-3">
        {meeting && (
          <div className="rounded-lg bg-gray-900/90 px-4 py-2 text-sm font-semibold text-gray-100 shadow-lg ring-1 ring-gray-700">
            {meeting.title}
          </div>
        )}
        {isHost && (
          <button
            onClick={handleEndMeeting}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-lg ring-1 ring-red-700 hover:bg-red-700 transition-colors"
          >
            End Meeting
          </button>
        )}
      </div>

      <div className="fixed right-3 top-3 z-[130]">
        <button
          type="button"
          onClick={() => setPanelOpen(open => !open)}
          className="rounded-lg bg-gray-900/90 p-2 text-gray-300 shadow-lg ring-1 ring-gray-700 hover:bg-gray-800"
          title={panelOpen ? 'Hide meeting panel' : 'Show meeting panel'}
        >
          {panelOpen ? <X size={18} /> : <Users size={18} />}
        </button>
      </div>

      {panelOpen && (
        <aside className="fixed bottom-0 right-0 top-0 z-[120] flex w-full md:w-[400px] flex-col border-l border-gray-800 bg-gray-900 shadow-2xl">
          <div className="flex items-center border-b border-gray-800 p-3 pr-12 min-h-[50px]">
            <h3 className="text-sm font-semibold text-gray-100 capitalize">
              {sidePanel === 'participants' ? 'People' : sidePanel}
            </h3>
          </div>

          {sidePanel === 'participants' && (
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {participants.map(user => {
                const isExpanded = expandedUserId === user.id;
                const showAccordion = isHost && (meeting.type === 'standup' || meeting.type === 'project') && !['admin', 'manager'].includes(user.role);

                return (
                  <div key={user.id} className="rounded-lg bg-gray-800/50 border border-gray-700/50 overflow-hidden">
                    <div
                      onClick={() => showAccordion && setExpandedUserId(isExpanded ? null : user.id)}
                      className={`flex items-center gap-3 p-3 ${showAccordion ? 'cursor-pointer hover:bg-gray-700/50' : ''}`}
                    >
                      <Avatar name={user.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-gray-200">
                          {user.name} {user.id === meeting.hostId && <span className="text-xs text-primary-400">(Host)</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs capitalize text-gray-500">{user.role}</p>
                          {onlineUsers.includes(user.id) ? (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full font-medium"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> In Meeting</span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded-full font-medium"><span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span> Offline</span>
                          )}
                        </div>
                      </div>
                      {showAccordion && (
                        <div className="text-gray-500">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      )}
                    </div>

                    {isExpanded && showAccordion && (
                      <div className="p-3 border-t border-gray-700/50 bg-gray-900/50">
                        {meeting.type === 'standup' && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-primary-300 uppercase">
                              {meeting.standupType === 'evening' ? 'Evening Standup (What did you do today?)' : 'Morning Standup (What will you do today?)'}
                            </h4>

                            {(dynamicStandupInputs[user.id] || ['']).map((val, idx) => (
                              <input
                                key={idx}
                                className="input-field text-xs w-full mb-2"
                                placeholder={`Task ${idx + 1}...`}
                                value={val}
                                onChange={(e) => handleStandupInputChange(user.id, idx, e.target.value)}
                              />
                            ))}

                            <button
                              type="button"
                              onClick={() => handleAddStandupInput(user.id)}
                              className="text-xs text-primary-400 hover:text-primary-300 mb-2 flex items-center gap-1"
                            >
                              <Plus size={12} /> Add another task
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSubmitStandup(user.id)}
                              className="w-full rounded-lg bg-primary-600 py-1.5 text-xs text-white hover:bg-primary-700"
                            >
                              Save Standup Records
                            </button>
                          </div>
                        )}

                        {meeting.type === 'project' && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-primary-300 uppercase">Assign Project Task</h4>
                            <input className="input-field text-xs w-full" placeholder="Task title *" value={taskForm.title} onChange={event => setTaskForm({ ...taskForm, title: event.target.value })} />
                            <textarea className="input-field text-xs w-full" rows={2} placeholder="Description" value={taskForm.description} onChange={event => setTaskForm({ ...taskForm, description: event.target.value })} />
                            <input className="input-field text-xs w-full" type="date" value={taskForm.dueDate} onChange={event => setTaskForm({ ...taskForm, dueDate: event.target.value })} />
                            <select className="input-field text-xs w-full" value={taskForm.priority} onChange={event => setTaskForm({ ...taskForm, priority: event.target.value })}>
                              {['low', 'medium', 'high', 'critical'].map(priority => <option key={priority} value={priority}>{priority}</option>)}
                            </select>
                            {!meeting.projectId && projects.length > 0 && (
                              <select className="input-field text-xs w-full" value={taskForm.projectId} onChange={event => setTaskForm({ ...taskForm, projectId: event.target.value })}>
                                <option value="">Select project</option>
                                {projects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}
                              </select>
                            )}
                            <button
                              type="button"
                              onClick={() => handleAssignTask(user.id)}
                              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-1.5 text-xs text-white hover:bg-primary-700"
                            >
                              <Plus size={12} />
                              Assign Task
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {sidePanel === 'lobby' && isHost && (
            <div className="flex min-h-0 flex-1 flex-col">
              {toArray(meeting?.waitingRoom).filter(w => w.status === 'waiting').length > 0 && (
                <div className="border-b border-gray-800 p-3">
                  <button
                    onClick={handlePermitAll}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600/20 py-2 text-sm font-medium text-emerald-500 transition-colors hover:bg-emerald-600 hover:text-white"
                  >
                    <CheckSquare size={16} />
                    Permit All
                  </button>
                </div>
              )}
              <div className="flex-1 space-y-2 overflow-y-auto p-3">
                {toArray(meeting?.waitingRoom).filter(w => w.status === 'waiting').length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">
                    No pending requests
                  </div>
                ) : (
                  toArray(meeting?.waitingRoom).filter(w => w.status === 'waiting').map(w => {
                    const waitingUser = users.find(u => u.id === w.userId);
                    if (!waitingUser) return null;
                    return (
                      <div key={w.userId} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800/50 p-2">
                        <div className="flex items-center gap-2">
                          <Avatar name={waitingUser.name} size="xs" />
                          <div className="min-w-0">
                            <p className="truncate text-sm text-gray-200">{waitingUser.name}</p>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => handleWaitingRoomAction(w.userId, 'approved')} className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-600/20 text-emerald-500 hover:bg-emerald-600 hover:text-white" title="Approve">
                            <CheckSquare size={14} />
                          </button>
                          <button onClick={() => handleWaitingRoomAction(w.userId, 'rejected')} className="flex h-7 w-7 items-center justify-center rounded-md bg-red-600/20 text-red-500 hover:bg-red-600 hover:text-white" title="Deny">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {sidePanel === 'chat' && (
            <div className="flex min-h-0 flex-1 flex-col">
              {mentionNotifications.length > 0 && (
                <div className="border-b border-amber-500/20 bg-amber-500/10 px-3 py-2">
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-200">Mentions</p>
                    <span className="text-[10px] text-amber-200/70">{mentionNotifications.length}</span>
                  </div>
                  <div className="space-y-1">
                    {mentionNotifications.slice(0, 3).map(notification => (
                      <div key={notification.id} className="rounded-md border border-amber-500/20 bg-gray-950/40 px-2 py-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-medium text-amber-100">
                            {notification.isAllMention ? `${notification.senderName} mentioned everyone` : `${notification.senderName} mentioned you`}
                          </p>
                          <span className="shrink-0 text-[10px] text-amber-200/60">{formatChatTime(notification.timestamp)}</span>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-amber-100/70">{notification.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex-1 space-y-3 overflow-y-auto p-3 relative">
                {chatLogs.length === 0 ? (
                  <EmptyState
                    icon={MessageSquare}
                    title="No messages yet"
                    description="Be the first to start the conversation"
                  />
                ) : (
                  chatLogs.map(msg => {
                    const sender = users.find(user => user.id === (msg.userId || msg.senderId));
                    const mine = (msg.userId || msg.senderId) === currentUser.id;
                    const mentionedMe = !mine && toArray(msg.mentions).includes(currentUser.id);
                    return (
                      <div key={msg.id || msg.timestamp} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                        <Avatar name={sender?.name || 'User'} size="xs" />
                        <div className={`max-w-[80%] ${mine ? 'items-end' : ''} flex flex-col`}>
                          <p className="mb-0.5 text-xs text-gray-500">{sender?.name?.split(' ')[0] || 'User'}</p>
                          <div className={`rounded-lg border px-3 py-2 text-sm ${
                            mine
                              ? 'border-primary-600 bg-primary-700 text-white'
                              : mentionedMe
                                ? 'border-amber-400/60 bg-amber-500/15 text-amber-50'
                                : 'border-transparent bg-gray-800 text-gray-200'
                          }`}>
                            {renderMessageText(msg.text, msg.mentions, users, mine)}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="flex gap-2 border-t border-gray-800 p-3 relative">
                {mentionQuery !== null && (
                  <div className="absolute bottom-full left-0 mb-2 w-full rounded-lg border border-gray-700 bg-gray-900 shadow-xl overflow-hidden z-10 max-h-48 overflow-y-auto">
                    {mentionSuggestions.length === 0 ? (
                      <div className="px-3 py-2 text-sm text-gray-500">No present participants</div>
                    ) : (
                      mentionSuggestions.map((u, idx) => (
                        <button
                          key={u.id}
                          type="button"
                          className={`flex w-full items-center gap-2 px-3 py-2 text-left transition-colors ${selectedMentionIdx === idx ? 'bg-gray-700' : 'hover:bg-gray-700'}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleMentionSelect(u)}
                          onMouseEnter={() => setSelectedMentionIdx(idx)}
                        >
                          {u.id === '__all__' ? (
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-xs font-semibold text-amber-200">@</div>
                          ) : (
                            <Avatar name={u.name} size="xs" />
                          )}
                          <span className="text-sm text-gray-200">{u.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
                <input
                  value={message}
                  onChange={event => {
                    const val = event.target.value;
                    setMessage(val);
                    const lastWord = val.split(' ').pop();
                    if (lastWord.startsWith('@')) {
                      setMentionQuery(lastWord.slice(1));
                      setSelectedMentionIdx(0);
                    } else {
                      setMentionQuery(null);
                    }
                  }}
                  onKeyDown={event => {
                    if (mentionQuery !== null && mentionSuggestions.length > 0) {
                      if (event.key === 'Enter' || event.key === 'Tab') {
                        event.preventDefault();
                        handleMentionSelect(mentionSuggestions[selectedMentionIdx] || mentionSuggestions[0]);
                        return;
                      } else if (event.key === 'ArrowDown') {
                        event.preventDefault();
                        setSelectedMentionIdx(prev => Math.min(prev + 1, mentionSuggestions.length - 1));
                        return;
                      } else if (event.key === 'ArrowUp') {
                        event.preventDefault();
                        setSelectedMentionIdx(prev => Math.max(prev - 1, 0));
                        return;
                      }
                    }

                    if (event.key === 'Escape') setMentionQuery(null);
                    else if (event.key === 'Enter') sendMessage();
                  }}
                  onBlur={() => setTimeout(() => setMentionQuery(null), 150)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none focus:border-primary-600"
                />
                <button
                  type="button"
                  onClick={sendMessage}
                  className="rounded-lg bg-primary-600 p-2 text-white hover:bg-primary-700"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          )}

          {sidePanel === 'evaluate' && isHost && meeting.type === 'interview' && (
            <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
              <InterviewEvaluationPanel
                meeting={meeting}
                currentUser={{ id: meeting.hostId }}
                onSaved={() => {}}
              />
            </div>
          )}

          <div className="flex border-t border-gray-800 bg-gray-950 mt-auto">
            {[
              ['participants', 'People', Users],
              ['chat', 'Chat', MessageSquare],
              ...(isHost ? [['lobby', 'Lobby', Clock]] : []),
              ...(isHost && meeting.type === 'interview' ? [['evaluate', 'Evaluate', ClipboardList]] : []),
              ...(isHost && meeting.type === 'standup' ? [['standup', 'Standup', Grid3X3]] : []),
              ...(isHost && meeting.type === 'project' ? [['tasks', 'Tasks', CheckSquare]] : [])
            ].map(([tab, label, Icon]) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setSidePanel(tab);
                  if (tab === 'chat') {
                    setUnreadMentionCount(0);
                  }
                }}
                className={`relative flex flex-1 items-center justify-center gap-1 py-3 text-xs font-medium ${sidePanel === tab
                    ? 'border-t-2 border-primary-500 text-primary-400 bg-gray-900 -mt-[1px]'
                    : 'border-t-2 border-transparent text-gray-500 hover:text-gray-300 hover:bg-gray-900/50 -mt-[1px]'
                  }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
                {tab === 'lobby' && toArray(meeting?.waitingRoom).filter(w => w.status === 'waiting').length > 0 && (
                  <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500"></span>
                )}
                {tab === 'chat' && unreadMentionCount > 0 && sidePanel !== 'chat' && (
                  <span className="absolute right-2 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-semibold text-gray-950">
                    {unreadMentionCount > 9 ? '9+' : unreadMentionCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </aside>
      )}

      <Modal isOpen={showLeaveModal} onClose={cancelLeave} title="Leave Meeting" size="sm">
        <div className="p-5 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-950 text-red-500">
            <X size={24} />
          </div>
          <p className="mb-6 text-sm text-gray-300">Are you sure you want to leave this meeting?</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={cancelLeave}>Cancel</Button>
            <Button variant="danger" className="w-full" onClick={() => { confirmLeave(); }}>Leave</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function toArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function getMentionSuggestions(query, presentParticipants) {
  const normalizedQuery = (query || '').replace(/\s+/g, '').toLowerCase();
  const suggestions = [];

  if ('all'.includes(normalizedQuery)) {
    suggestions.push({ id: '__all__', name: '@all' });
  }

  return [
    ...suggestions,
    ...presentParticipants.filter(user =>
      user.name.replace(/\s+/g, '').toLowerCase().includes(normalizedQuery)
    )
  ];
}

function formatChatTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function renderMessageText(text, mentions, users, isMine) {
  if (!text) return '';
  const mentionIds = toArray(mentions);
  if (mentionIds.length === 0 && !/(^|\s)@all\b/i.test(text)) return text;

  const mentionedUsers = mentionIds.map(uid => users.find(u => u.id === uid)).filter(Boolean);
  const mentionTokens = new Set(['@all']);
  mentionedUsers.forEach(user => {
    mentionTokens.add(`@${user.name}`.toLowerCase());
    mentionTokens.add(`@${user.name.replace(/\s+/g, '')}`.toLowerCase());
  });

  return text.split(/(@\w+)/g).map((part, index) => {
    if (!part.startsWith('@') || !mentionTokens.has(part.toLowerCase())) {
      return part;
    }
    return (
      <span
        key={`${part}-${index}`}
        className={`mx-0.5 rounded-md px-1.5 py-0.5 font-medium ${isMine ? 'bg-white/20 text-white' : 'bg-amber-400/25 text-amber-100'}`}
      >
        {part}
      </span>
    );
  });
}

function ActiveParticipantsTracker({ onActiveParticipantsChange }) {
  const participants = useParticipants();
  
  useEffect(() => {
    const activeIds = participants.map(p => p.identity).filter(Boolean);
    onActiveParticipantsChange(activeIds);
  }, [participants, onActiveParticipantsChange]);

  return null;
}

const RemoteVideo = ({ stream, isMuted, ...props }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={videoRef} autoPlay playsInline muted={isMuted} {...props} />;
};
