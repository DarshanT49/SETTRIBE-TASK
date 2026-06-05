import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { ArrowLeft, Video, Users, MessageSquare, UserPlus, CheckCircle, XCircle, Clock, Calendar, Link as LinkIcon, FileText, CheckSquare, List, Download } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS, asyncGet, asyncSet, apiPut } from '../services/storage';
import { exportMeetingReport } from '../utils/exportExcel';
import { createNotification, createBulkNotifications } from '../services/notifications';
   
import { Avatar, Button, Badge, Modal, Select, Textarea, StatusBadge, Skeleton, Input } from '../components/ui';
   
import { formatDate, formatDateTime, formatDuration, canStartMeeting, getMeetingStatus } from '../utils/dates';
import { markMeetingAbsent } from '../services/meetings';
import toast from 'react-hot-toast';

export default function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();

  const [meeting, setMeeting] = useState(null);
  const [users, setUsers] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [showCantAttend, setShowCantAttend] = useState(false);
  const [cantAttendForm, setCantAttendForm] = useState({ reason: 'Personal Emergency', notes: '' });
  const [activeTab, setActiveTab] = useState(location.state?.endedByHost ? 'attendance' : 'overview'); // overview, notes, tasks, attendance

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleForm, setRescheduleForm] = useState({ date: '', time: '', duration: '' });

  const load = async () => {
    try {
      const meetings = await asyncGet(KEYS.MEETINGS) || [];
      const m = meetings.find(m => m.id === id);
      if (!m || m.type === 'interview') { navigate('/meetings'); return; }

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

  const isHostEarly = meeting?.hostId === currentUser?.id;

  useEffect(() => {
    if (location.state?.endedByHost && !isHostEarly) {
      toast('Meeting have ended by host', { icon: 'ℹ️', duration: 5000 });
      navigate('.', { replace: true, state: {} });
    }
  }, [location.state, isHostEarly, navigate]);

  if (loading) return <Skeleton className="h-96" />;
  if (!meeting) return null;

  const getUser = (uid) => users.find(u => String(u.id) === String(uid));
  const host = getUser(meeting.hostId);
  const isHost = String(meeting.hostId) === String(currentUser.id);
  const isParticipant = meeting.participantIds.map(String).includes(String(currentUser.id));
  const myRsvp = rsvps.find(r => String(r.meetingId) === String(id) && String(r.userId) === String(currentUser.id));

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

  const effectiveStatus = getMeetingStatus(meeting);

  const handleCantAttend = async () => {
    const allRsvps = await asyncGet(KEYS.MEETING_RSVPS) || [];
    const existing = allRsvps.findIndex(r => String(r.meetingId) === String(id) && String(r.userId) === String(currentUser.id));
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
    updatedMeeting.joinRequests = (updatedMeeting.joinRequests || []).map(r => String(r.userId) === String(userId) ? { ...r, status: approve ? 'approved' : 'rejected' } : r);
    if (approve && !updatedMeeting.participantIds.map(String).includes(String(userId))) {
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
    
    const todayStr = new Date().toISOString().split('T')[0];
    if (rescheduleForm.date < todayStr) {
      toast.error('Date cannot be in the past');
      return;
    }
    if (rescheduleForm.date === todayStr) {
      const now = new Date();
      const currentHour = String(now.getHours()).padStart(2, '0');
      const currentMinute = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHour}:${currentMinute}`;
      if (rescheduleForm.time < currentTimeStr) {
        toast.error('Time cannot be in the past');
        return;
      }
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

  const handleMissedMeeting = async () => {
    // API call to the backend
    await markMeetingAbsent(id, currentUser.id);

    // Optimistic UI update
    const updatedLogs = [...attendanceLogs, {
      userId: currentUser.id,
      joinTime: null,
      leaveTime: null,
      durationMinutes: 0,
      status: 'absent',
      selfReported: true,
      markedAt: new Date().toISOString()
    }];
    const updatedMeeting = { ...meeting, attendanceLogs: updatedLogs };
    await apiPut(KEYS.MEETINGS, id, updatedMeeting);
    setMeeting(updatedMeeting);
    toast.success('Attendance marked as absent');
  };

  const rsvpStatus = { attending: { color: 'text-emerald-400', icon: '✅' }, declined: { color: 'text-red-400', icon: '❌' }, no_response: { color: 'text-gray-500', icon: '⬜' } };

  const TABS = [
    { id: 'overview', label: 'Overview', icon: List },
    // { id: 'notes', label: 'Notes', icon: FileText },
    { id: 'tasks', label: 'Assigned Tasks', icon: CheckSquare },
    { id: 'attendance', label: 'Attendance Logs', icon: Users },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Header Area */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm transition-colors">
            <ArrowLeft size={16} />Back to Meetings
          </button>
          <Button 
            onClick={() => exportMeetingReport(meeting, attendanceLogs, allTasks.filter(t => taskAssignedInMeeting.includes(t.id)), users)} 
            variant="secondary" 
            size="sm" 
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-gray-700"
          >
            <Download size={14} /> Export Report
          </Button>
        </div>
        <div className="card p-6 border-l-4 border-l-primary-500">
          <div className="flex items-start justify-between flex-wrap gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <h1 className="text-2xl font-bold text-gray-100">{meeting.title}</h1>
                <StatusBadge status={effectiveStatus} />
                <span className="badge bg-blue-900/40 text-blue-400 border border-blue-800/50 capitalize px-3 py-1">{meeting.type}</span>
                {relatedProject && (
                  <Link to={`/projects/${relatedProject.id}`} className="badge bg-purple-900/30 text-purple-400 border border-purple-800/50 hover:bg-purple-900/50 transition-colors flex items-center gap-1">
                    <LinkIcon size={12} /> {relatedProject.title}
                  </Link>
                )}
              </div>
              <p className="text-base text-gray-300 mb-4">{meeting.agenda}</p>

              <div className="flex flex-wrap gap-6 text-sm text-gray-400 bg-gray-800/30 p-3 rounded-lg border border-gray-700/50 inline-flex">
                <span className="flex items-center gap-2"><Calendar size={16} className="text-gray-500" /> {formatDate(meeting.date)}</span>
                <span className="flex items-center gap-2"><Clock size={16} className="text-gray-500" /> {meeting.time} ({formatDuration(meeting.duration)})</span>
                <span className="flex items-center gap-2"><Avatar name={host?.name} size="xs" /> Host: <span className="font-medium text-gray-300">{host?.name}</span></span>
                <span className="flex items-center gap-2"><Users size={16} className="text-gray-500" /> {meeting.participantIds.length} Participants</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 min-w-[140px]">
              {(isParticipant || isHost) && canJoin && effectiveStatus !== 'completed' && effectiveStatus !== 'cancelled' && (isHost || myRsvp?.status !== 'declined') && (
                <Link to={`/meetings/${id}/room`} className="w-full">
                  <Button className="w-full justify-center shadow-lg shadow-primary-900/20"><Video size={16} />Join Meeting</Button>
                </Link>
              )}
              {meeting.meetingMode === 'external' && meeting.externalLink && (
                <a href={meeting.externalLink} target="_blank" rel="noreferrer" className="w-full">
                  <Button variant="secondary" className="w-full justify-center"><LinkIcon size={14} /> External Link</Button>
                </a>
              )}
              {isHost && (
                <Button variant="secondary" onClick={() => setShowRescheduleModal(true)} className="w-full justify-center"><Calendar size={14} /> Reschedule</Button>
              )}
              {isParticipant && myRsvp?.status !== 'declined' && effectiveStatus === 'upcoming' && (
                <Button variant="danger" size="sm" onClick={() => setShowCantAttend(true)}>Can't Attend</Button>
              )}
              {!isParticipant && meeting.allowJoinRequests && !(meeting.joinRequests || []).find(r => String(r.userId) === String(currentUser.id)) && (
                <Button variant="secondary" size="sm" onClick={handleJoinRequest}><UserPlus size={14} />Request to Join</Button>
              )}

              {/* I Missed This Meeting button for participants after completion if not in logs */}
              {effectiveStatus === 'completed' && isParticipant &&
                !attendanceLogs.some(l => String(l.userId) === String(currentUser.id)) && (
                  <Button variant="secondary" size="sm" onClick={handleMissedMeeting} className="w-full justify-center border-red-900/50 text-red-400 hover:bg-red-900/20">
                    <XCircle size={14} /> I Missed This Meeting
                  </Button>
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
                <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2"><FileText size={18} className="text-primary-400" /> Detailed Description</h2>
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

          {/* TAB: Notes (Commented out as per request) */}
          {/*
          {activeTab === 'notes' && (
            <div className="space-y-6 animate-fade-in">
              <div className="card p-6">
                <h2 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2"><FileText size={18} className="text-primary-400" /> Participant Notes</h2>
                {rsvps.filter(r => r.meetingId === id && r.notes && r.status === 'attending').length === 0 ? (
                  <div className="text-center py-10 bg-gray-800/30 rounded-xl border border-gray-700/50 border-dashed">
                    <FileText size={32} className="mx-auto text-gray-600 mb-3" />
                    <p className="text-gray-400 text-sm">No notes were taken by participants during this meeting.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rsvps.filter(r => r.meetingId === id && r.notes && r.status === 'attending').map((rsvp, idx) => {
                      const u = getUser(rsvp.userId);
                      return (
                        <div key={idx} className="p-4 bg-gray-800/30 rounded-xl border border-gray-700">
                          <div className="flex items-center gap-2 mb-3">
                            <Avatar name={u?.name} size="xs" />
                            <span className="text-sm font-medium text-gray-200">{u?.name}'s Notes</span>
                          </div>
                          <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                            {rsvp.notes}
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
          */}

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
              <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">Meeting Attendance Roster</h2>

              {effectiveStatus !== 'completed' ? (
                <div className="text-center py-8 bg-gray-800/30 rounded-xl border border-gray-700/50 border-dashed">
                  <Clock size={24} className="mx-auto text-gray-600 mb-2" />
                  <p className="text-gray-400 text-sm">Attendance roster will be available once the meeting is completed.</p>
                </div>
              ) : (
                <>
                  {(() => {
                    const scheduledMinutes = parseInt(meeting.duration) || 60;
                    // Build roster: everyone in participantIds (and host)
                    const allInvited = Array.from(new Set([meeting.hostId, ...meeting.participantIds]));

                    const roster = allInvited.map(uid => {
                      const u = getUser(uid);
                      const log = attendanceLogs.find(l => String(l.userId) === String(uid));
                      const rsvp = rsvps.find(r => String(r.meetingId) === String(id) && String(r.userId) === String(uid));

                      let status = 'absent';
                      let durationMinutes = 0;
                      let joinTime = null;
                      let leaveTime = null;

                      if (log) {
                        durationMinutes = log.durationMinutes || 0;
                        joinTime = log.joinTime;
                        leaveTime = log.leaveTime;
                        
                        if (log.status === 'absent') {
                          status = 'absent';
                        } else if (durationMinutes < 1) {
                          status = 'absent';
                        } else {
                          status = 'present';
                        }
                      }

                      const percent = Math.min(100, Math.round((durationMinutes / scheduledMinutes) * 100));

                      return { uid, user: u, status, durationMinutes, percent, joinTime, leaveTime, rsvp };
                    });

                    const presentCount = roster.filter(r => r.status === 'present').length;
                    const absentCount = roster.filter(r => r.status === 'absent').length;
                    const rate = roster.length > 0 ? Math.round((presentCount / roster.length) * 100) : 0;

                    return (
                      <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl text-center">
                            <p className="text-xs text-gray-500 mb-1">Present</p>
                            <p className="text-2xl font-semibold text-emerald-400">{presentCount}</p>
                          </div>
                          <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl text-center">
                            <p className="text-xs text-gray-500 mb-1">Absent</p>
                            <p className="text-2xl font-semibold text-red-400">{absentCount}</p>
                          </div>
                          <div className="bg-gray-800/50 border border-gray-700 p-4 rounded-xl text-center">
                            <p className="text-xs text-gray-500 mb-1">Attendance Rate</p>
                            <p className="text-2xl font-semibold text-blue-400">{rate}%</p>
                          </div>
                        </div>

                        {/* Roster List */}
                        <div className="space-y-3">
                          {roster.map(r => (
                            <div key={r.uid} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-800/30 border border-gray-700 rounded-xl gap-4">
                              <div className="flex items-center gap-3 w-1/3">
                                <Avatar name={r.user?.name} size="md" />
                                <div>
                                  <span className="text-sm font-medium text-gray-200 block">{r.user?.name || 'Unknown'}</span>
                                  <span className={`text-xs font-semibold capitalize
                                    ${r.status === 'present' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {r.status}
                                  </span>
                                </div>
                              </div>

                              <div className="flex-1 flex justify-center text-xs text-gray-400 space-x-6">
                                {r.status !== 'absent' ? (
                                  <>
                                    <div><span className="text-gray-500 block">Joined</span>{r.joinTime ? new Date(r.joinTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                                    <div><span className="text-gray-500 block">Left</span>{r.leaveTime ? new Date(r.leaveTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</div>
                                    <div><span className="text-gray-500 block">Active Time</span>{formatDuration(r.durationMinutes)}</div>
                                  </>
                                ) : (
                                  <div className="text-gray-500 italic">
                                    {r.rsvp?.status === 'declined' ? `Declined (${r.rsvp.reason})` : 'Did not join'}
                                  </div>
                                )}
                              </div>

                              <div className="w-24">
                                <div className="text-xs text-gray-500 text-right mb-1">{r.percent}%</div>
                                <div className="w-full bg-gray-700 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${r.percent >= 80 ? 'bg-emerald-500' : r.percent > 0 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${r.percent}%` }}
                                  ></div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
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
                const rsvp = rsvps.find(r => String(r.meetingId) === String(id) && String(r.userId) === String(uid));
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
            <Input 
              label="New Date *" 
              type="date" 
              value={rescheduleForm.date} 
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setRescheduleForm({ ...rescheduleForm, date: e.target.value })} 
            />
            <Input 
              label="New Time *" 
              type="time" 
              value={rescheduleForm.time} 
              min={rescheduleForm.date === new Date().toISOString().split('T')[0] ? (() => {
                const now = new Date();
                return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
              })() : undefined}
              onChange={e => setRescheduleForm({ ...rescheduleForm, time: e.target.value })} 
            />
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
