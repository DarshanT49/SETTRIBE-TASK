import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic, MicOff, Video, VideoOff, Monitor, PhoneOff, Users, MessageSquare,
  Smile, Hand, Maximize2, Copy, Grid3X3, Settings, Clock, ChevronRight, X, Plus, Send
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS,  asyncGet, asyncSet } from '../services/storage';
import { Avatar, Button, Input, Select, Textarea } from '../components/ui';
import { formatDate } from '../utils/dates';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const EMOJIS = ['👍', '❤️', '😂', '😮', '🎉', '🔥', '👏', '🙌'];

export default function MeetingRoom() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [users, setUsers] = useState([]);
  const [elapsed, setElapsed] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(true);
  const [handRaised, setHandRaised] = useState(false);
  const [sidePanel, setSidePanel] = useState('chat');
  const [panelOpen, setPanelOpen] = useState(true);
  const [message, setMessage] = useState('');
  const [chatLogs, setChatLogs] = useState([]);
  const [floatingEmoji, setFloatingEmoji] = useState(null);
  const [showEmojis, setShowEmojis] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [gridLayout, setGridLayout] = useState('speaker');
  const [background, setBackground] = useState('none');
  const [standupData, setStandupData] = useState({});
  const [taskForm, setTaskForm] = useState({ title: '', description: '', assigneeIds: [], projectId: '', priority: 'medium', dueDate: '' });
  const videoRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    (async () => {
    const meetings = await asyncGet(KEYS.MEETINGS) || [];
    const m = meetings.find(m => m.id === id);
    if (!m) { navigate('/meetings'); return; }
    setMeeting(m);
    setUsers(await asyncGet(KEYS.USERS) || []);
    setChatLogs(m.chatLogs || []);
    // Start camera
    if (navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }).catch(() => setCameraOn(false));
    }
    // Timer
    const startTime = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => { clearInterval(timer); if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop()); };
  })();
  }, [id]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatLogs]);

  if (!meeting) return null;

  const getUser = (uid) => users.find(u => u.id === uid);
  const isHost = meeting.hostId === currentUser.id;
  const participants = meeting.participantIds.map(uid => users.find(u => u.id === uid)).filter(Boolean);


  const formatTime = (s) => `${String(Math.floor(s / 3600)).padStart(2, '0')}:${String(Math.floor((s % 3600) / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const sendMessage = async () => {
    if (!message.trim()) return;
    const newMsg = { id: uuidv4(), userId: currentUser.id, text: message, timestamp: new Date().toISOString() };
    const newLogs = [...chatLogs, newMsg];
    setChatLogs(newLogs);
    setMessage('');
    const meetings = await asyncGet(KEYS.MEETINGS) || [];
    const idx = meetings.findIndex(m => m.id === id);
    if (idx !== -1) { meetings[idx].chatLogs = newLogs; asyncSet(KEYS.MEETINGS, meetings); }
  };

  const sendEmoji = (emoji) => {
    setShowEmojis(false);
    setFloatingEmoji({ emoji, x: Math.random() * 60 + 20, id: Date.now() });
    setTimeout(() => setFloatingEmoji(null), 3000);
  };

  const toggleScreenShare = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      toast.success('Screen sharing started');
      stream.getVideoTracks()[0].onended = () => { toast.info('Screen sharing stopped'); };
    } catch { toast.error('Screen sharing not supported or denied'); }
  };

  const handleLeave = () => {
    if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    navigate(`/meetings/${id}`);
  };

  const handleSubmitStandup = async (participantId) => {
    const data = standupData[participantId];
    if (!data?.yesterday && !data?.today) { toast.error('Please fill in at least Yesterday and Today fields'); return; }
    const meetings = await asyncGet(KEYS.MEETINGS) || [];
    const idx = meetings.findIndex(m => m.id === id);
    if (idx !== -1) {
      meetings[idx].standupLogs = [...(meetings[idx].standupLogs || []), { ...data, userId: participantId, loggedBy: currentUser.id, timestamp: new Date().toISOString() }];
      asyncSet(KEYS.MEETINGS, meetings);
    }
    toast.success('Stand-up logged!');
  };

  const handleAssignTask = async () => {
    if (!taskForm.title || taskForm.assigneeIds.length === 0) { toast.error('Task title and assignees are required'); return; }
    const newTask = { id: uuidv4(), projectId: taskForm.projectId, milestoneId: null, sprintId: null, ...taskForm, creatorId: currentUser.id, assignedBy: currentUser.id, status: 'todo', startDate: new Date().toISOString().split('T')[0], attachments: [], comments: [], activityLog: [], delayReason: '', newDueDate: null, isDelayed: false, createdAt: new Date().toISOString(), tags: [] };
    const tasks = await asyncGet(KEYS.TASKS) || [];
    tasks.push(newTask);
    asyncSet(KEYS.TASKS, tasks);
    const meetings = await asyncGet(KEYS.MEETINGS) || [];
    const idx = meetings.findIndex(m => m.id === id);
    if (idx !== -1) { meetings[idx].taskAssignedInMeeting = [...(meetings[idx].taskAssignedInMeeting || []), newTask.id]; asyncSet(KEYS.MEETINGS, meetings); }
    toast.success('Task assigned!');
    setTaskForm({ title: '', description: '', assigneeIds: [], projectId: '', priority: 'medium', dueDate: '' });
  };

  const bgStyle = background === 'blur' ? { filter: 'blur(8px)' } : {};

  return (
    <div className="fixed inset-0 bg-gray-950 flex flex-col" style={{ zIndex: 100 }}>
      {/* Floating emoji */}
      {floatingEmoji && (
        <div className="emoji-float" style={{ left: `${floatingEmoji.x}%`, bottom: '80px' }}>{floatingEmoji.emoji}</div>
      )}

      {/* Video Grid */}
      <div className={`flex-1 overflow-hidden ${panelOpen ? 'mr-80' : ''}`}>
        <div className={`h-full p-3 ${gridLayout === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 gap-2' : 'flex flex-col'}`}>
          {/* Main/Self Video */}
          <div className={`relative bg-gray-900 rounded-xl overflow-hidden ${gridLayout === 'speaker' ? 'flex-1' : ''}`}>
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={bgStyle} />
            {!cameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <Avatar name={currentUser.name} size="xl" />
              </div>
            )}
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <span className="text-xs bg-black/60 text-white px-2 py-1 rounded-full">{currentUser.name} (You)</span>
              {muted && <span className="p-1 bg-red-600 rounded-full"><MicOff size={10} className="text-white" /></span>}
              {handRaised && <span className="text-base">🙋</span>}
            </div>
            {gridLayout === 'speaker' && (
              <div className="absolute top-0 right-0 bottom-0 w-32 flex flex-col gap-1 p-2 overflow-y-auto">
                {participants.filter(u => u.id !== currentUser.id).slice(0, 6).map(u => (
                  <div key={u.id} className="relative bg-gray-800 rounded-lg aspect-video flex items-center justify-center">
                    <Avatar name={u.name} size="sm" />
                    <span className="absolute bottom-1 left-1 text-xs text-white bg-black/60 px-1 rounded truncate max-w-full">{u.name.split(' ')[0]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Grid tiles */}
          {gridLayout === 'grid' && participants.filter(u => u.id !== currentUser.id).map(u => (
            <div key={u.id} className="relative bg-gray-800 rounded-xl flex items-center justify-center aspect-video">
              <Avatar name={u.name} size="lg" />
              <span className="absolute bottom-2 left-2 text-xs text-white bg-black/60 px-1.5 py-0.5 rounded">{u.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Control Bar */}
      <div className="h-16 bg-gray-900 border-t border-gray-800 flex items-center justify-between px-6">
        {/* Timer */}
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Clock size={14} />
          <span className="font-mono">{formatTime(elapsed)}</span>
        </div>

        {/* Center controls */}
        <div className="flex items-center gap-3">
          <ControlBtn active={muted} onClick={() => setMuted(!muted)} icon={muted ? MicOff : Mic} activeClass="bg-red-600 text-white" tooltip={muted ? 'Unmute' : 'Mute'} />
          <ControlBtn active={!cameraOn} onClick={() => setCameraOn(!cameraOn)} icon={cameraOn ? Video : VideoOff} activeClass="bg-red-600 text-white" tooltip={cameraOn ? 'Turn off camera' : 'Turn on camera'} />
          <ControlBtn onClick={toggleScreenShare} icon={Monitor} tooltip="Share screen" />
          <div className="relative">
            <ControlBtn onClick={() => setShowEmojis(!showEmojis)} icon={Smile} tooltip="React" />
            {showEmojis && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 border border-gray-700 rounded-xl p-2 flex gap-1 shadow-xl">
                {EMOJIS.map(e => <button key={e} onClick={() => sendEmoji(e)} className="text-xl hover:scale-125 transition-transform">{e}</button>)}
              </div>
            )}
          </div>
          <ControlBtn active={handRaised} onClick={() => setHandRaised(!handRaised)} icon={Hand} activeClass="bg-yellow-600 text-white" tooltip={handRaised ? 'Lower hand' : 'Raise hand'} />
          <ControlBtn onClick={() => setGridLayout(g => g === 'speaker' ? 'grid' : 'speaker')} icon={Grid3X3} tooltip="Toggle layout" />
          <button onClick={() => setShowLeaveModal(true)} className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-white text-sm font-medium transition-colors">
            <PhoneOff size={16} /> Leave
          </button>
        </div>

        {/* Right: Panel toggle */}
        <button onClick={() => setPanelOpen(!panelOpen)} className="flex items-center gap-2 text-gray-400 hover:text-gray-200 text-sm">
          <Users size={16} />
          {panelOpen ? 'Hide Panel' : 'Show Panel'}
        </button>
      </div>

      {/* Side Panel */}
      {panelOpen && (
        <div className="fixed right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-gray-800 flex flex-col z-50">
          {/* Panel Tabs */}
          <div className="flex border-b border-gray-800">
            {[['chat', 'Chat', MessageSquare], ['participants', 'People', Users],
              ...(isHost && meeting.type === 'standup' ? [['standup', 'Standup', Grid3X3]] : []),
              ...(isHost && meeting.type === 'project' ? [['tasks', 'Tasks', Plus]] : []),
            ].map(([tab, label, Icon]) => (
              <button key={tab} onClick={() => setSidePanel(tab)}
                className={`flex-1 flex items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${sidePanel === tab ? 'text-primary-400 border-b-2 border-primary-500' : 'text-gray-500 hover:text-gray-300'}`}>
                <Icon size={14} />{label}
              </button>
            ))}
          </div>

          {/* Chat Tab */}
          {sidePanel === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {chatLogs.map(msg => {
                  const u = getUser(msg.userId);
                  return (
                    <div key={msg.id} className={`flex gap-2 ${msg.userId === currentUser.id ? 'flex-row-reverse' : ''}`}>
                      <Avatar name={u?.name} size="xs" />
                      <div className={`max-w-[80%] ${msg.userId === currentUser.id ? 'items-end' : ''} flex flex-col`}>
                        <p className="text-xs text-gray-500 mb-0.5">{u?.name?.split(' ')[0]}</p>
                        <div className={`px-3 py-2 rounded-xl text-sm ${msg.userId === currentUser.id ? 'bg-primary-700 text-white' : 'bg-gray-800 text-gray-200'}`}>
                          {msg.text}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>
              <div className="p-3 border-t border-gray-800 flex gap-2">
                <input value={message} onChange={e => setMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 outline-none focus:border-primary-600" />
                <button onClick={sendMessage} className="p-2 bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"><Send size={14} className="text-white" /></button>
              </div>
            </div>
          )}

          {/* Participants Tab */}
          {sidePanel === 'participants' && (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {participants.map(u => (
                <div key={u.id} className="flex items-center gap-3 p-2 hover:bg-gray-800 rounded-lg">
                  <Avatar name={u.name} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm text-gray-200">{u.name} {u.id === meeting.hostId && <span className="text-xs text-primary-400">(Host)</span>}</p>
                  </div>
                  <div className="flex gap-1 text-gray-600">
                    <MicOff size={12} /><VideoOff size={12} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Standup Tab */}
          {sidePanel === 'standup' && isHost && (
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <p className="text-xs text-gray-500">Log standup for each participant</p>
              {participants.filter(u => !['admin', 'manager'].includes(u.role)).map(u => (
                <div key={u.id} className="p-3 bg-gray-800/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Avatar name={u.name} size="xs" />
                    <span className="text-sm font-medium text-gray-200">{u.name}</span>
                  </div>
                  <div className="space-y-2">
                    {['yesterday', 'today', 'blockers'].map(field => (
                      <textarea key={field} placeholder={field === 'yesterday' ? "Yesterday's work..." : field === 'today' ? "Today's plan..." : "Any blockers?"} className="input-field text-xs" rows={2}
                        onChange={e => setStandupData(d => ({ ...d, [u.id]: { ...(d[u.id] || {}), [field]: e.target.value } }))} />
                    ))}
                    <button onClick={() => handleSubmitStandup(u.id)} className="w-full py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs rounded-lg transition-colors">Log Stand-up</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Task Assignment Tab */}
          {sidePanel === 'tasks' && isHost && (
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <p className="text-xs text-gray-500">Assign a task to meeting participants</p>
              <input placeholder="Task title *" className="input-field text-sm" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} />
              <textarea placeholder="Description" className="input-field text-sm" rows={2} value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} />
              <input type="date" className="input-field text-sm" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} />
              <select className="input-field text-sm" value={taskForm.priority} onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}>
                {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
              </select>
              <div>
                <p className="text-xs text-gray-500 mb-1">Assign To</p>
                <div className="space-y-1">
                  {participants.map(u => (
                    <label key={u.id} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input type="checkbox" checked={taskForm.assigneeIds.includes(u.id)} onChange={e => setTaskForm(f => ({ ...f, assigneeIds: e.target.checked ? [...f.assigneeIds, u.id] : f.assigneeIds.filter(id => id !== u.id) }))} />
                      <span className="text-xs text-gray-300">{u.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={handleAssignTask} className="w-full py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm rounded-lg transition-colors">Assign Task</button>
            </div>
          )}
        </div>
      )}

      {/* Leave Confirmation */}
      {showLeaveModal && (
        <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-100 mb-2">Leave Meeting?</h3>
            <p className="text-sm text-gray-400 mb-4">Are you sure you want to leave the meeting?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLeaveModal(false)} className="flex-1 py-2 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 transition-colors">Stay</button>
              <button onClick={handleLeave} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ControlBtn({ onClick, icon: Icon, active, activeClass, tooltip }) {
  return (
    <button onClick={onClick} title={tooltip}
      className={`p-3 rounded-xl transition-all duration-200 ${active ? (activeClass || 'bg-gray-700 text-white') : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'}`}>
      <Icon size={18} />
    </button>
  );
}
