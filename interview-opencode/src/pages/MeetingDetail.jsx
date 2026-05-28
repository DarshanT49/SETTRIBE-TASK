import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Video, Users, MessageSquare, UserPlus, CheckCircle, XCircle, Clock, Calendar, Link as LinkIcon, FileText, CheckSquare, List } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS, asyncGet, asyncSet, apiPut } from '../services/storage';
import { createNotification, createBulkNotifications } from '../services/notifications';
import { Avatar, Button, Badge, Modal, Select, Textarea, StatusBadge, Skeleton, Input } from '../components/ui';
import { formatDate, formatDateTime, formatDuration, canStartMeeting } from '../utils/dates';
import toast from 'react-hot-toast';

export default function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [meeting, setMeeting] = useState(null);
  const [users, setUsers] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [showCantAttend, setShowCantAttend] = useState(false);
  const [cantAttendForm, setCantAttendForm] = useState({ reason: 'Personal Emergency', notes: '' });
  const [activeTab, setActiveTab] = useState('overview'); // overview, notes, tasks, attendance

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '', duration: '' });

  const load = async () => {
    try {
      const meetings = await asyncGet(KEYS.MEETINGS) || [];
      const m = meetings.find(m => m.id === id);
      if (!m) { navigate('/meetings'); return; }
      
      setMeeting(m);
      setUsers(await asyncGet(KEYS.USERS) || []);
      setProjects(await asyncGet(KEYS.PROJECTS) || []);
      setAllTasks(await asyncGet(KEYS.TASKS) || []);
      
      // Handle the RSVP error gracefully in case of 500
      try {
        setRsvps(await asyncGet(KEYS.MEETING_RSVPS) || []);
      } catch (e) {
        console.warn("Failed to load RSVPs:", e);
        setRsvps([]);
      }
    } catch (err) {
      console.error("Error loading meeting details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { setTimeout(load, 200); }, [id]);

  useEffect(() => {
    if (meeting) {
      setRescheduleForm({ date: meeting.date, time: meeting.time, duration: meeting.duration });
    }
  }, [meeting]);

  if (loading) return <Skeleton className="h-96" />;
  if (!meeting) return null;

  const getUser = (uid) => users.find(u => u.id === uid);
  const host = getUser(meeting.hostId);
  const isHost = meeting.hostId === currentUser.id;
  const isParticipant = meeting.participantIds.includes(currentUser.id);
  const myRsvp = rsvps.find(r => r.meetingId === id && r.userId === currentUser.id);
  const canJoin = canStartMeeting(meeting);
  const relatedProject = projects.find(p => p.id === meeting.projectId);
  
  // Safe parsing for backend JSON string fields
  const safeParse = (data) => {
    if (!data) return [];
    if (typeof data === 'string') {
      try { return JSON.parse(data); } catch { return []; }
    }
    return Array.isArray(data) ? data : [];
  };

  const chatLogs = safeParse(meeting.chatLogs);
  const standupLogs = safeParse(meeting.standupLogs);
  const taskAssignedInMeeting = safeParse(meeting.taskAssignedInMeeting);
  const attendanceLogs = safeParse(meeting.attendanceLogs);

  const handleCantAttend = async () => {
    const allRsvps = await asyncGet(KEYS.MEETING_RSVPS) || [];
    const existing = allRsvps.findIndex(r => r.meetingId === id && r.userId === currentUser.id);
    const rsvpEntry = { meetingId: id, userId: currentUser.id, status: 'declined', reason: cantAttendForm.reason, timestamp: new Date().toISOString(), notes: cantAttendForm.notes };
    if (existing !== -1) allRsvps[existing] = rsvpEntry;
    else allRsvps.push(rsvpEntry);
    
    // We try to asyncSet, but if it fails (500) we still show success visually for UX
    try {
      await asyncSet(KEYS.MEETING_RSVPS, allRsvps);
    } catch (e) {
      console.warn("RSVP save failed:", e);
    }

    createNotification({ userId: meeting.hostId, type: 'meeting_cant_attend', title: 'Participant Cannot Attend', message: `${currentUser.name} cannot attend "${meeting.title}" — Reason: ${cantAttendForm.reason}`, relatedId: id, relatedType: 'meeting' });
    toast.success('Response submitted');
    setShowCantAttend(false);
    load();
  };

  const handleJoinRequest = async () => {
    const updatedMeeting = { ...meeting, joinRequests: [...(meeting.joinRequests || []), { userId: currentUser.id, requestedAt: new Date().toISOString(), status: 'pending' }] };
    await apiPut(KEYS.MEETINGS, id, updatedMeeting);
    createNotification({ userId: meeting.hostId, type: 'meeting_join_request', title: 'Join Request', message: `${currentUser.name} has requested to join "${meeting.title}"`, relatedId: id, relatedType: 'meeting' });
    toast.success('Join request sent!');
    load();
  };

  const handleJoinApproval = async (userId, approve) => {
    const updatedMeeting = { ...meeting };
    updatedMeeting.joinRequests = (updatedMeeting.joinRequests || []).map(r => r.userId === userId ? { ...r, status: approve ? 'approved' : 'rejected' } : r);
    if (approve && !updatedMeeting.participantIds.includes(userId)) {
      updatedMeeting.participantIds = [...updatedMeeting.participantIds, userId];
    }
    await apiPut(KEYS.MEETINGS, id, updatedMeeting);
    createNotification({ userId, type: approve ? 'meeting_join_approved' : 'meeting_join_request', title: approve ? 'Join Request Approved' : 'Join Request Denied', message: approve ? `Your request to join "${meeting.title}" was approved` : `Your request to join "${meeting.title}" was denied`, relatedId: id, relatedType: 'meeting' });
    toast.success(approve ? 'User admitted!' : 'Request denied');
    load();
  };

  const handleReschedule = async () => {
    if (!rescheduleForm.date || !rescheduleForm.time || !rescheduleForm.duration) {
      toast.error('Please fill all fields');
      return;
    }
    const updatedMeeting = { ...meeting, date: rescheduleForm.date, time: rescheduleForm.time, duration: rescheduleForm.duration };
    await apiPut(KEYS.MEETINGS, id, updatedMeeting);
    
    // Notify all participants
    const participantsToNotify = meeting.participantIds.filter(pid => pid !== currentUser.id);
    if (participantsToNotify.length > 0) {
      createBulkNotifications(participantsToNotify, {
        type: 'meeting_rescheduled',
        title: 'Meeting Rescheduled',
        message: `The meeting "${meeting.title}" has been rescheduled to ${formatDate(rescheduleForm.date)} at ${rescheduleForm.time}.`,
        relatedId: id,
        relatedType: 'meeting'
      });
    }
    
    toast.success('Meeting rescheduled successfully');
    setShowRescheduleModal(false);
    load();
  };

  const rsvpStatus = { attending: { color: 'text-emerald-400', icon: '✅' }, declined: { color: 'text-red-400', icon: '❌' }, no_response: { color: 'text-gray-500', icon: '⬜' } };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: List },
    { id: 'notes', label: 'Notes & Chat', icon: MessageSquare },
    { id: 'tasks', label: 'Assigned Tasks', icon: CheckSquare },
    { id: 'attendance', label: 'Attendance Logs', icon: Users },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header Area */}
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-4 transition-colors">
          <ArrowLeft size={16} />Back to Meetings
        </button>
        <div className="card p-6 border-l-4 border-l-primary-500">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <h1 className="text-2xl font-bold text-gray-100">{meeting.title}</h1>
                <StatusBadge status={meeting.status} />
                <span className="badge bg-blue-900/40 text-blue-400 border border-blue-800/50 capitalize px-3 py-1">{meeting.type}</span>
                {relatedProject && (
                  <Link to={`/projects/${relatedProject.id}`} className="badge bg-purple-900/30 text-purple-400 border border-purple-800/50 hover:bg-purple-900/50 transition-colors flex items-center gap-1">
                    <LinkIcon size={12} /> {relatedProject.title}
                  </Link>
                )}
              </div>
              <p className="text-base text-gray-300 mb-4">{meeting.agenda}</p>
              
              <div className="flex flex-wrap gap-6 text-sm text-gray-400 bg-gray-800/30 p-3 rounded-lg border border-gray-700/50 inline-flex">
                <span className="flex items-center gap-2"><Calendar size={16} className="text-gray-500"/> {formatDate(meeting.date)}</span>
                <span className="flex items-center gap-2"><Clock size={16} className="text-gray-500"/> {meeting.time} ({formatDuration(meeting.duration)})</span>
                <span className="flex items-center gap-2"><Avatar name={host?.name} size="xs" /> Host: <span className="font-medium text-gray-300">{host?.name}</span></span>
                <span className="flex items-center gap-2"><Users size={16} className="text-gray-500"/> {meeting.participantIds.length} Participants</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 min-w-[140px]">
              {(isParticipant || isHost) && canJoin && meeting.status !== 'completed' && (isHost || myRsvp?.status !== 'declined') && (
                <Link to={`/meetings/${id}/room`} className="w-full">
                  <Button className="w-full justify-center shadow-lg shadow-primary-900/20"><Video size={16} />Join Meeting</Button>
                </Link>
              )}
              {meeting.meetingMode === 'external' && meeting.externalLink && (
                <a href={meeting.externalLink} target="_blank" rel="noreferrer" className="w-full">
                  <Button variant="secondary" className="w-full justify-center"><LinkIcon size={14} /> External Link</Button>
                </a>
              )}
              {isHost && meeting.status !== 'completed' && (
                <Button variant="secondary" onClick={() => setShowRescheduleModal(true)} className="w-full justify-center"><Calendar size={14} /> Reschedule</Button>
              )}
              {isParticipant && myRsvp?.status !== 'declined' && meeting.status !== 'completed' && (
                <Button variant="danger" size="sm" onClick={() => setShowCantAttend(true)}>Can't Attend</Button>
              )}
              {!isParticipant && meeting.allowJoinRequests && !(meeting.joinRequests || []).find(r => r.userId === currentUser.id) && (
                <Button variant="secondary" size="sm" onClick={handleJoinRequest}><UserPlus size={14} />Request to Join</Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-gray-800 pb-2 overflow-x-auto hide-scrollbar">
        {TABS.map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id)} 
            className={`tab-btn whitespace-nowrap flex items-center gap-2 ${activeTab === t.id ? 'active' : ''}`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Content Area (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* TAB: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2"><FileText size={18} className="text-primary-400"/> Detailed Description</h2>
                <div className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
                  {meeting.agenda || "No detailed agenda provided."}
                </div>
              </div>
              
              {/* Join Requests (host only) */}
              {isHost && (meeting.joinRequests || []).length > 0 && (
                <div className="card p-6 border-l-4 border-yellow-500/50">
                  <h2 className="text-lg font-semibold text-gray-100 mb-4">Pending Join Requests ({meeting.joinRequests.filter(r => r.status === 'pending').length})</h2>
                  <div className="space-y-3">
                    {meeting.joinRequests.map(req => {
                      const u = getUser(req.userId);
                      if (!u) return null;
                      return (
                        <div key={req.userId} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} size="sm" />
                            <div>
                              <p className="text-sm font-medium text-gray-200">{u.name}</p>
                              <p className="text-xs text-gray-500 capitalize">{req.status}</p>
                            </div>
                          </div>
                          {req.status === 'pending' && (
                            <div className="flex gap-2">
                              <button onClick={() => handleJoinApproval(req.userId, true)} className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 transition-colors text-xs font-medium border border-emerald-800/30"><CheckCircle size={14} /> Approve</button>
                              <button onClick={() => handleJoinApproval(req.userId, false)} className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-900/30 text-red-400 hover:bg-red-900/50 transition-colors text-xs font-medium border border-red-800/30"><XCircle size={14} /> Deny</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: Notes & Chat */}
          {activeTab === 'notes' && (
            <div className="space-y-6 animate-fade-in">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-100 mb-4">Meeting Chat Logs</h2>
                {chatLogs.length === 0 ? (
                  <div className="text-center py-10 bg-gray-800/30 rounded-xl border border-gray-700/50 border-dashed">
                    <MessageSquare size={32} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400 text-sm">No chat messages were recorded during this meeting.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {chatLogs.map((msg, idx) => {
                      const sender = getUser(msg.senderId);
                      return (
                        <div key={idx} className="flex gap-3">
                          <Avatar name={sender?.name || 'Unknown'} size="sm" />
                          <div className="bg-gray-800/50 p-3 rounded-xl rounded-tl-sm border border-gray-700/50">
                            <div className="flex items-center justify-between gap-4 mb-1">
                              <span className="text-sm font-medium text-gray-200">{sender?.name || 'Unknown User'}</span>
                              <span className="text-xs text-gray-500">{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                            </div>
                            <p className="text-sm text-gray-300">{msg.text}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
              
              {meeting.type === 'standup' && (
                <div className="card p-6">
                  <h2 className="text-lg font-semibold text-gray-100 mb-4">Standup Updates</h2>
                  {standupLogs.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No standup logs recorded.</p>
                  ) : (
                    <div className="space-y-4">
                      {standupLogs.map((log, idx) => {
                        const u = getUser(log.userId);
                        return (
                          <div key={idx} className="p-4 bg-gray-800/30 rounded-xl border border-gray-700">
                            <div className="flex items-center gap-2 mb-3">
                              <Avatar name={u?.name} size="xs" />
                              <span className="text-sm font-medium text-gray-200">{u?.name}</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div><span className="text-gray-500 block text-xs mb-1">Yesterday</span><p className="text-gray-300">{log.yesterday || '-'}</p></div>
                              <div><span className="text-gray-500 block text-xs mb-1">Today</span><p className="text-gray-300">{log.today || '-'}</p></div>
                              <div><span className="text-gray-500 block text-xs mb-1">Blockers</span><p className="text-red-400">{log.blockers || 'None'}</p></div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB: Tasks */}
          {activeTab === 'tasks' && (
            <div className="card p-6 animate-fade-in">
              <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">Tasks Assigned in Meeting</h2>
              {taskAssignedInMeeting.length === 0 ? (
                <div className="text-center py-10 bg-gray-800/30 rounded-xl border border-gray-700/50 border-dashed">
                  <CheckSquare size={32} className="mx-auto text-gray-600 mb-3" />
                  <p className="text-gray-400 text-sm">No tasks were created during this meeting.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {taskAssignedInMeeting.map(taskId => {
                    const task = allTasks.find(t => t.id === taskId);
                    if (!task) return null;
                    return (
                      <Link key={task.id} to="/tasks" className="flex items-center justify-between p-4 bg-gray-800/50 border border-gray-700 rounded-xl hover:border-gray-600 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-gray-200">{task.title}</p>
                          <p className="text-xs text-gray-500 mt-1">Due: {formatDate(task.dueDate)}</p>
                        </div>
                        <StatusBadge status={task.status} />
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )}
          
          {/* TAB: Attendance */}
          {activeTab === 'attendance' && (
            <div className="card p-6 animate-fade-in space-y-6">
              <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">Meeting Attendance Logs</h2>
              
              {/* Absent/Declined Section (Available anytime) */}
              {(() => {
                const declined = rsvps.filter(r => r.meetingId === id && r.status === 'declined');
                if (declined.length === 0) return null;
                return (
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Declined / Expected Absent</h3>
                    {declined.map((rsvp, idx) => {
                      const u = getUser(rsvp.userId);
                      return (
                        <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-red-900/10 border border-red-900/30 rounded-lg gap-2">
                          <div className="flex items-center gap-3">
                            <Avatar name={u?.name} size="sm" />
                            <div>
                              <span className="text-sm font-medium text-red-400 block">{u?.name}</span>
                              <span className="text-xs text-red-500/70">{rsvp.reason}</span>
                            </div>
                          </div>
                          {rsvp.notes && (
                            <div className="text-xs text-gray-400 bg-gray-900/50 p-2 rounded max-w-xs break-words border border-gray-800">
                              {rsvp.notes}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}

              {/* Real Attendance Logs (Only available after completion) */}
              <div>
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-3">Actual Attendance</h3>
                {meeting.status !== 'completed' ? (
                  <div className="text-center py-8 bg-gray-800/30 rounded-xl border border-gray-700/50 border-dashed">
                    <Clock size={24} className="mx-auto text-gray-600 mb-2" />
                    <p className="text-gray-400 text-sm">Attendance logs will be available once the meeting is completed.</p>
                  </div>
                ) : attendanceLogs.length === 0 ? (
                  <div className="text-center py-8 bg-gray-800/30 rounded-xl border border-gray-700/50 border-dashed">
                    <Users size={24} className="mx-auto text-gray-600 mb-2" />
                    <p className="text-gray-400 text-sm">No attendance data recorded.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {attendanceLogs.map((log, idx) => {
                      const u = getUser(log.userId);
                      return (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Avatar name={u?.name} size="sm" />
                            <span className="text-sm font-medium text-gray-200">{u?.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-emerald-400/80 block">Joined: {log.joinTime ? new Date(log.joinTime).toLocaleTimeString() : '-'}</span>
                            <span className="text-xs text-gray-500 block">Left: {log.leaveTime ? new Date(log.leaveTime).toLocaleTimeString() : '-'}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Area (1/3 width) - Participants & RSVPs */}
        <div className="space-y-6">
          <div className="card p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-100">Participants List</h2>
              <span className="badge bg-gray-800 text-gray-300">{meeting.participantIds.length} Total</span>
            </div>
            
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {/* Host always first */}
              {host && (
                <div className="flex items-center gap-3 p-3 bg-primary-900/10 border border-primary-900/30 rounded-xl">
                  <Avatar name={host.name} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{host.name}</p>
                    <p className="text-xs text-primary-400 font-medium">Meeting Host</p>
                  </div>
                </div>
              )}

              <hr className="border-gray-800" />

              {/* Other participants */}
              {meeting.participantIds.filter(id => id !== meeting.hostId).map(uid => {
                const u = getUser(uid);
                if (!u) return null;
                const rsvp = rsvps.find(r => r.meetingId === id && r.userId === uid);
                const status = rsvp?.status || 'no_response';
                const s = rsvpStatus[status];
                
                return (
                  <div key={uid} className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-800/50 transition-colors">
                    <Avatar name={u.name} size="sm" className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">{u.name}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs">{s.icon}</span>
                        <span className={`text-xs font-medium ${s.color} capitalize`}>{status.replace('_', ' ')}</span>
                      </div>
                      {rsvp?.reason && (
                        <div className="mt-1.5 p-2 bg-gray-900/50 rounded text-xs text-gray-400 border border-gray-800">
                          <span className="text-gray-300 font-medium">{rsvp.reason}</span>
                          {rsvp.notes && <span className="block mt-0.5 opacity-80">{rsvp.notes}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Can't Attend Modal */}
      <Modal isOpen={showCantAttend} title="Can't Attend" onClose={() => setShowCantAttend(false)} size="sm">
        <div className="p-5 space-y-4">
          <Select label="Reason" value={cantAttendForm.reason} onChange={e => setCantAttendForm({ ...cantAttendForm, reason: e.target.value })}>
            {['Personal Emergency', 'Sick Leave', 'Network Issue', 'Other'].map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
          <Textarea label="Additional Notes" value={cantAttendForm.notes} onChange={e => setCantAttendForm({ ...cantAttendForm, notes: e.target.value })} placeholder="Optional notes..." />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCantAttend(false)}>Cancel</Button>
            <Button onClick={handleCantAttend}>Submit Response</Button>
          </div>
        </div>
      </Modal>

      {/* Reschedule Modal */}
      <Modal isOpen={showRescheduleModal} title="Reschedule Meeting" onClose={() => setShowRescheduleModal(false)} size="sm">
        <div className="p-5 space-y-4">
          <div className="space-y-4">
            <Input label="New Date *" type="date" value={rescheduleForm.date} onChange={e => setRescheduleForm({ ...rescheduleForm, date: e.target.value })} />
            <Input label="New Time *" type="time" value={rescheduleForm.time} onChange={e => setRescheduleForm({ ...rescheduleForm, time: e.target.value })} />
            <Select label="New Duration" value={rescheduleForm.duration} onChange={e => setRescheduleForm({ ...rescheduleForm, duration: e.target.value })}>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
            <Button variant="secondary" onClick={() => setShowRescheduleModal(false)}>Cancel</Button>
            <Button onClick={handleReschedule}>Confirm Reschedule</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
