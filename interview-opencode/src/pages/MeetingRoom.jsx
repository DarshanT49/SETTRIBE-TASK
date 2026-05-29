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
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, Button } from '../components/ui';
import { KEYS, apiPut, asyncGet, asyncSet } from '../services/storage';
import { getMeetingJoinToken, markMeetingJoined, markMeetingLeft } from '../services/meetings';

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

  useEffect(() => {
    let cancelled = false;

    const loadRoom = async () => {
      try {
        const [allMeetings, allUsers, allProjects] = await Promise.all([
          asyncGet(KEYS.MEETINGS),
          asyncGet(KEYS.USERS),
          asyncGet(KEYS.PROJECTS)
        ]);
        const foundMeeting = (allMeetings || []).find(item => item.id === id);
        if (!foundMeeting) {
          navigate('/meetings');
          return;
        }
        if (foundMeeting.meetingMode === 'external') {
          setError('This meeting uses an external link. Open it from the meeting details page.');
          setLoading(false);
          return;
        }

        const tokenResponse = await getMeetingJoinToken(id, currentUser);
        if (cancelled) return;
        setMeeting(foundMeeting);
        setUsers(allUsers || []);
        setProjects(allProjects || []);
        setChatLogs(toArray(foundMeeting.chatLogs));
        setRoomConfig(tokenResponse);
      } catch (err) {
        const message = err?.response?.data?.message || 'Unable to join this meeting room.';
        setError(message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRoom();
    return () => {
      cancelled = true;
      if (joinedRef.current && currentUser?.id) {
        markMeetingLeft(id, currentUser.id);
      }
    };
  }, [currentUser, id, navigate]);

  const participants = (meeting?.participantIds || [])
    .map(userId => users.find(user => user.id === userId))
    .filter(Boolean);
  const isHost = meeting?.hostId === currentUser.id;

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

  const handleSubmitStandup = async (participantId) => {
    const data = standupData[participantId];
    if (!data?.yesterday && !data?.today) {
      toast.error('Please fill in at least Yesterday and Today fields');
      return;
    }
    const logs = [
      ...toArray(meeting.standupLogs),
      { ...data, userId: participantId, loggedBy: currentUser.id, timestamp: new Date().toISOString() }
    ];
    const updatedMeeting = { ...meeting, standupLogs: logs };
    setMeeting(updatedMeeting);
    await apiPut(KEYS.MEETINGS, id, updatedMeeting);
    toast.success('Stand-up logged');
  };

  const handleAssignTask = async () => {
    if (!taskForm.title || taskForm.assigneeIds.length === 0) {
      toast.error('Task title and assignees are required');
      return;
    }
    const newTask = {
      id: uuidv4(),
      projectId: taskForm.projectId,
      milestoneId: null,
      sprintId: null,
      ...taskForm,
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
    toast.success('Task assigned');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950 text-gray-200">
        <Loader2 className="mr-3 animate-spin" size={22} />
        Joining meeting...
      </div>
    );
  }

  if (error || !meeting || !roomConfig) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950 p-6">
        <div className="w-full max-w-md rounded-lg border border-gray-800 bg-gray-900 p-6 text-center">
          <h1 className="mb-2 text-lg font-semibold text-gray-100">Cannot join meeting</h1>
          <p className="mb-5 text-sm text-gray-400">{error || 'Room configuration is unavailable.'}</p>
          <Button onClick={() => navigate(`/meetings/${id}`)}>Back to Details</Button>
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
              ['chat', 'Chat', MessageSquare],
              ...(isHost && meeting.type === 'standup' ? [['standup', 'Standup', Grid3X3]] : []),
              ...(isHost && meeting.type === 'project' ? [['tasks', 'Tasks', CheckSquare]] : [])
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
              {participants.map(user => (
                <div key={user.id} className="flex items-center gap-3 rounded-lg p-2 hover:bg-gray-800">
                  <Avatar name={user.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-gray-200">
                      {user.name} {user.id === meeting.hostId && <span className="text-xs text-primary-400">(Host)</span>}
                    </p>
                    <p className="text-xs capitalize text-gray-500">{user.role}</p>
                  </div>
                </div>
              ))}
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

          {sidePanel === 'standup' && isHost && (
            <div className="flex-1 space-y-4 overflow-y-auto p-3">
              {participants.filter(user => !['admin', 'manager'].includes(user.role)).map(user => (
                <div key={user.id} className="rounded-lg bg-gray-800/50 p-3">
                  <div className="mb-3 flex items-center gap-2">
                    <Avatar name={user.name} size="xs" />
                    <span className="text-sm font-medium text-gray-200">{user.name}</span>
                  </div>
                  {['yesterday', 'today', 'blockers'].map(field => (
                    <textarea
                      key={field}
                      placeholder={field}
                      className="input-field mb-2 text-xs"
                      rows={2}
                      onChange={event => setStandupData(data => ({
                        ...data,
                        [user.id]: { ...(data[user.id] || {}), [field]: event.target.value }
                      }))}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => handleSubmitStandup(user.id)}
                    className="w-full rounded-lg bg-primary-600 py-1.5 text-xs text-white hover:bg-primary-700"
                  >
                    Log Stand-up
                  </button>
                </div>
              ))}
            </div>
          )}

          {sidePanel === 'tasks' && isHost && (
            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              <input className="input-field text-sm" placeholder="Task title *" value={taskForm.title} onChange={event => setTaskForm({ ...taskForm, title: event.target.value })} />
              <textarea className="input-field text-sm" rows={2} placeholder="Description" value={taskForm.description} onChange={event => setTaskForm({ ...taskForm, description: event.target.value })} />
              <input className="input-field text-sm" type="date" value={taskForm.dueDate} onChange={event => setTaskForm({ ...taskForm, dueDate: event.target.value })} />
              <select className="input-field text-sm" value={taskForm.priority} onChange={event => setTaskForm({ ...taskForm, priority: event.target.value })}>
                {['low', 'medium', 'high', 'critical'].map(priority => <option key={priority} value={priority}>{priority}</option>)}
              </select>
              {projects.length > 0 && (
                <select className="input-field text-sm" value={taskForm.projectId} onChange={event => setTaskForm({ ...taskForm, projectId: event.target.value })}>
                  <option value="">No project</option>
                  {projects.map(project => <option key={project.id} value={project.id}>{project.title}</option>)}
                </select>
              )}
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Assign To</p>
                {participants.map(user => (
                  <label key={user.id} className="flex cursor-pointer items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={taskForm.assigneeIds.includes(user.id)}
                      onChange={event => setTaskForm(form => ({
                        ...form,
                        assigneeIds: event.target.checked
                          ? [...form.assigneeIds, user.id]
                          : form.assigneeIds.filter(userId => userId !== user.id)
                      }))}
                    />
                    <span className="text-xs text-gray-300">{user.name}</span>
                  </label>
                ))}
              </div>
              <button
                type="button"
                onClick={handleAssignTask}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-2 text-sm text-white hover:bg-primary-700"
              >
                <Plus size={14} />
                Assign Task
              </button>
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
