import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
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
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, Button } from '../components/ui';
import { KEYS, apiPut, asyncGet, asyncSet } from '../services/storage';
import { getMeetingJoinToken, markMeetingJoined, markMeetingLeft, saveStandupRecords } from '../services/meetings';

export default function MeetingRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [roomConfig, setRoomConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [connectionError, setConnectionError] = useState('');
  const [panelOpen, setPanelOpen] = useState(true);
  const [sidePanel, setSidePanel] = useState('participants');
  const [expandedUserId, setExpandedUserId] = useState(null);
  const [dynamicStandupInputs, setDynamicStandupInputs] = useState({});
  const [message, setMessage] = useState('');
  const [chatLogs, setChatLogs] = useState([]);
  const [standupData, setStandupData] = useState({});
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

  useEffect(() => {
    let cancelled = false;
    let pollInterval = null;

    const fetchMeetingData = async () => {
      const allMeetings = await asyncGet(KEYS.MEETINGS);
      return (allMeetings || []).find(item => item.id === id);
    };

    const checkWaitingRoomStatus = async (m) => {
      if (cancelled) return;
      
      const isHost = m.hostId === currentUser.id;
      const isAdmin = currentUser.role === 'admin';
      // Admin and host bypass the waiting room entirely
      const requiresApproval = !isAdmin && !isHost;
      
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
          navigate('/meetings');
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
          setMeeting(m);
          setChatLogs(toArray(m.chatLogs));
          await checkWaitingRoomStatus(m);
        }
      } catch (e) {}
    }, 3000);

    return () => {
      cancelled = true;
      if (pollInterval) clearInterval(pollInterval);
      if (joinedRef.current && currentUser?.id) {
        markMeetingLeft(id, currentUser.id);
      }
    };
  }, [currentUser, id, navigate]);

  const participants = (meeting?.participantIds || [])
    .map(userId => users.find(user => user.id === userId))
    .filter(Boolean);
  const isHost = meeting?.hostId === currentUser.id;

  const handleWaitingRoomAction = async (userId, status) => {
    const updatedWait = toArray(meeting.waitingRoom).map(w => w.userId === userId ? { ...w, status } : w);
    const updatedMeeting = { ...meeting, waitingRoom: updatedWait };
    setMeeting(updatedMeeting);
    await apiPut(KEYS.MEETINGS, id, updatedMeeting);
    toast.success(status === 'approved' ? 'Allowed into meeting' : 'Denied entry');
  };

  const handleConnected = useCallback(() => {
    if (joinedRef.current) return;
    joinedRef.current = true;
    markMeetingJoined(id, currentUser.id);
  }, [currentUser.id, id]);

  const handleDisconnected = useCallback(() => {
    if (joinedRef.current) {
      joinedRef.current = false;
      markMeetingLeft(id, currentUser.id);
      navigate(`/meetings/${id}`);
    }
  }, [currentUser.id, id, navigate]);

  const sendMessage = async () => {
    if (!message.trim() || !meeting) return;
    const newMsg = {
      id: uuidv4(),
      userId: currentUser.id,
      senderId: currentUser.id,
      text: message.trim(),
      timestamp: new Date().toISOString()
    };
    const newLogs = [...chatLogs, newMsg];
    const updatedMeeting = { ...meeting, chatLogs: newLogs };
    setChatLogs(newLogs);
    setMessage('');
    setMeeting(updatedMeeting);
    await apiPut(KEYS.MEETINGS, id, updatedMeeting);
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
      const records = validInputs.map(content => ({
        userId: participantId,
        content: content.trim()
      }));
      await saveStandupRecords(id, records);
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
  // Admin and host never go to the waiting room
  const requiresApproval = !isAdminNow && !isHostNow;
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
              <Button onClick={() => navigate('/meetings')} variant="primary" className="w-full justify-center">
                Back to Meetings
              </Button>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary-950 text-primary-500">
                <Loader2 size={24} className="animate-spin" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-gray-100">Waiting for Host</h2>
              <p className="mb-6 text-sm text-gray-400">You are in the waiting room. Please wait for the host to let you in.</p>
              <Button onClick={() => navigate('/meetings')} variant="secondary" className="w-full justify-center">
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
          <Button onClick={() => navigate('/meetings')} variant="primary" className="w-full justify-center">
            Back to Meetings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-950">
      {/* Waiting Room Notifications for Host */}
      {isHost && toArray(meeting?.waitingRoom).filter(w => w.status === 'waiting').length > 0 && (
        <div className="fixed left-1/2 top-16 z-[160] flex w-[min(92vw,400px)] -translate-x-1/2 flex-col gap-2">
          {toArray(meeting?.waitingRoom).filter(w => w.status === 'waiting').map(w => {
            const waitingUser = users.find(u => u.id === w.userId);
            if (!waitingUser) return null;
            return (
              <div key={w.userId} className="flex items-center justify-between rounded-lg border border-primary-800 bg-primary-950/95 p-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <Avatar name={waitingUser.name} size="sm" />
                  <div>
                    <p className="text-sm font-semibold text-primary-100">{waitingUser.name}</p>
                    <p className="text-xs text-primary-300">is asking to join the meeting</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleWaitingRoomAction(w.userId, 'approved')} className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white hover:bg-emerald-700">
                    <CheckSquare size={16} />
                  </button>
                  <button onClick={() => handleWaitingRoomAction(w.userId, 'rejected')} className="flex h-8 w-8 items-center justify-center rounded-md bg-red-600 text-white hover:bg-red-700">
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {connectionError && (
        <div className="fixed left-1/2 top-4 z-[150] w-[min(92vw,520px)] -translate-x-1/2 rounded-lg border border-red-800 bg-red-950/95 p-4 shadow-xl">
          <h2 className="text-sm font-semibold text-red-100">Meeting media server is unreachable</h2>
          <p className="mt-1 text-xs leading-5 text-red-200">{connectionError}</p>
        </div>
      )}
      <div className={`h-full ${panelOpen ? 'mr-80' : ''}`}>
        <LiveKitRoom
          token={roomConfig.token}
          serverUrl={roomConfig.url}
          connect
          audio
          video
          onConnected={handleConnected}
          onDisconnected={handleDisconnected}
          onError={() => {
            setConnectionError(`The browser could not connect to ${roomConfig.url}. Start LiveKit on port 7880 or update LIVEKIT_URL to the reachable LiveKit WebSocket URL.`);
          }}
          data-lk-theme="default"
          className="h-full"
        >
          <VideoConference />
        </LiveKitRoom>
      </div>

      <button
        type="button"
        onClick={() => setPanelOpen(open => !open)}
        className="fixed right-3 top-3 z-[130] rounded-lg bg-gray-900/90 p-2 text-gray-300 shadow-lg ring-1 ring-gray-700 hover:bg-gray-800"
        title={panelOpen ? 'Hide meeting panel' : 'Show meeting panel'}
      >
        {panelOpen ? <X size={18} /> : <Users size={18} />}
      </button>

      {panelOpen && (
        <aside className="fixed bottom-0 right-0 top-0 z-[120] flex w-80 flex-col border-l border-gray-800 bg-gray-900">
          <div className="flex border-b border-gray-800 pr-11">
            {[
              ['participants', 'People', Users],
              ['chat', 'Chat', MessageSquare]
            ].map(([tab, label, Icon]) => (
              <button
                key={tab}
                type="button"
                onClick={() => setSidePanel(tab)}
                className={`flex flex-1 items-center justify-center gap-1 py-3 text-xs font-medium ${
                  sidePanel === tab ? 'border-b-2 border-primary-500 text-primary-400' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Icon size={14} />
                {label}
              </button>
            ))}
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
                        <p className="text-xs capitalize text-gray-500">{user.role}</p>
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

          {sidePanel === 'chat' && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto p-3">
                {chatLogs.map(msg => {
                  const sender = users.find(user => user.id === (msg.userId || msg.senderId));
                  const mine = (msg.userId || msg.senderId) === currentUser.id;
                  return (
                    <div key={msg.id || msg.timestamp} className={`flex gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                      <Avatar name={sender?.name || 'User'} size="xs" />
                      <div className={`max-w-[80%] ${mine ? 'items-end' : ''} flex flex-col`}>
                        <p className="mb-0.5 text-xs text-gray-500">{sender?.name?.split(' ')[0] || 'User'}</p>
                        <div className={`rounded-lg px-3 py-2 text-sm ${mine ? 'bg-primary-700 text-white' : 'bg-gray-800 text-gray-200'}`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 border-t border-gray-800 p-3">
                <input
                  value={message}
                  onChange={event => setMessage(event.target.value)}
                  onKeyDown={event => event.key === 'Enter' && sendMessage()}
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


        </aside>
      )}
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


const RemoteVideo = ({ stream, isMuted, ...props }) => {
  const videoRef = useRef(null);
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);
  return <video ref={videoRef} autoPlay playsInline muted={isMuted} {...props} />;
};
