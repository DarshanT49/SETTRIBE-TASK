import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Video, Users, MessageSquare, UserPlus, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS,  asyncGet, asyncSet } from '../services/storage';
import { createNotification } from '../services/notifications';
import { Avatar, Button, Badge, Modal, Select, Textarea, StatusBadge, Skeleton } from '../components/ui';
import { formatDate, formatDateTime, formatDuration, canStartMeeting } from '../utils/dates';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export default function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [meeting, setMeeting] = useState(null);
  const [users, setUsers] = useState([]);
  const [rsvps, setRsvps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCantAttend, setShowCantAttend] = useState(false);
  const [cantAttendForm, setCantAttendForm] = useState({ reason: 'Personal Emergency', notes: '' });

  const load = async () => {
    const meetings = await asyncGet(KEYS.MEETINGS) || [];
    const m = meetings.find(m => m.id === id);
    if (!m) { navigate('/meetings'); return; }
    setMeeting(m);
    setUsers(await asyncGet(KEYS.USERS) || []);
    setRsvps(await asyncGet(KEYS.MEETING_RSVPS) || []);
    setLoading(false);
  };

  useEffect(() => { setTimeout(load, 200); }, [id]);

  if (loading) return <Skeleton className="h-96" />;
  if (!meeting) return null;

  const getUser = (uid) => users.find(u => u.id === uid);
  const host = getUser(meeting.hostId);
  const isHost = meeting.hostId === currentUser.id;
  const isParticipant = meeting.participantIds.includes(currentUser.id);
  const myRsvp = rsvps.find(r => r.meetingId === id && r.userId === currentUser.id);
  const canJoin = canStartMeeting(meeting);

  const handleCantAttend = async () => {
    const allRsvps = await asyncGet(KEYS.MEETING_RSVPS) || [];
    const existing = allRsvps.findIndex(r => r.meetingId === id && r.userId === currentUser.id);
    const rsvpEntry = { meetingId: id, userId: currentUser.id, status: 'declined', reason: cantAttendForm.reason, timestamp: new Date().toISOString(), notes: cantAttendForm.notes };
    if (existing !== -1) allRsvps[existing] = rsvpEntry;
    else allRsvps.push(rsvpEntry);
    asyncSet(KEYS.MEETING_RSVPS, allRsvps);
    createNotification({ userId: meeting.hostId, type: 'meeting_cant_attend', title: 'Participant Cannot Attend', message: `${currentUser.name} cannot attend "${meeting.title}" — Reason: ${cantAttendForm.reason}`, relatedId: id, relatedType: 'meeting' });
    toast.success('Response submitted');
    setShowCantAttend(false);
    load();
  };

  const handleJoinRequest = async () => {
    const meetings = await asyncGet(KEYS.MEETINGS) || [];
    const idx = meetings.findIndex(m => m.id === id);
    if (idx !== -1) {
      meetings[idx].joinRequests = [...(meetings[idx].joinRequests || []), { userId: currentUser.id, requestedAt: new Date().toISOString(), status: 'pending' }];
      asyncSet(KEYS.MEETINGS, meetings);
    }
    createNotification({ userId: meeting.hostId, type: 'meeting_join_request', title: 'Join Request', message: `${currentUser.name} has requested to join "${meeting.title}"`, relatedId: id, relatedType: 'meeting' });
    toast.success('Join request sent!');
    load();
  };

  const handleJoinApproval = async (userId, approve) => {
    const meetings = await asyncGet(KEYS.MEETINGS) || [];
    const idx = meetings.findIndex(m => m.id === id);
    if (idx !== -1) {
      meetings[idx].joinRequests = meetings[idx].joinRequests.map(r => r.userId === userId ? { ...r, status: approve ? 'approved' : 'rejected' } : r);
      if (approve) meetings[idx].participantIds = [...meetings[idx].participantIds, userId];
      asyncSet(KEYS.MEETINGS, meetings);
    }
    createNotification({ userId, type: approve ? 'meeting_join_approved' : 'meeting_join_request', title: approve ? 'Join Request Approved' : 'Join Request Denied', message: approve ? `Your request to join "${meeting.title}" was approved` : `Your request to join "${meeting.title}" was denied`, relatedId: id, relatedType: 'meeting' });
    toast.success(approve ? 'User admitted!' : 'Request denied');
    load();
  };

  const rsvpStatus = { attending: { color: 'text-emerald-400', icon: '✅' }, declined: { color: 'text-red-400', icon: '❌' }, no_response: { color: 'text-gray-500', icon: '⬜' } };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-4"><ArrowLeft size={16} />Back</button>
        <div className="card p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-xl font-bold text-gray-100">{meeting.title}</h1>
                <StatusBadge status={meeting.status} />
                <span className="badge bg-blue-900/40 text-blue-400 border border-blue-800/50 capitalize">{meeting.type}</span>
              </div>
              <p className="text-sm text-gray-400">{meeting.agenda}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                <span>📅 {meeting.date} at {meeting.time}</span>
                <span>⏱ {formatDuration(meeting.duration)}</span>
                <span className="flex items-center gap-1"><Avatar name={host?.name} size="xs" />Host: {host?.name}</span>
                <span>👥 {meeting.participantIds.length} participants</span>
                {meeting.meetingMode === 'external' && meeting.externalLink && (
                  <a href={meeting.externalLink} target="_blank" rel="noreferrer" className="text-primary-400 hover:text-primary-300">🔗 External Link</a>
                )}
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {isParticipant && myRsvp?.status !== 'declined' && (
                <Button variant="secondary" size="sm" onClick={() => setShowCantAttend(true)}>Can't Attend</Button>
              )}
              {!isParticipant && meeting.allowJoinRequests && !(meeting.joinRequests || []).find(r => r.userId === currentUser.id) && (
                <Button variant="secondary" size="sm" onClick={handleJoinRequest}><UserPlus size={14} />Request to Join</Button>
              )}
              {(isParticipant || isHost) && canJoin && meeting.status !== 'completed' && (
                <Link to={`/meetings/${id}/room`}><Button><Video size={14} />Join Meeting</Button></Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Participants */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-100 mb-4">Participants ({meeting.participantIds.length})</h2>
          <div className="space-y-3">
            {meeting.participantIds.map(uid => {
              const u = getUser(uid);
              if (!u) return null;
              const rsvp = rsvps.find(r => r.meetingId === id && r.userId === uid);
              const status = rsvp?.status || 'no_response';
              const s = rsvpStatus[status];
              return (
                <div key={uid} className="flex items-center gap-3">
                  <Avatar name={u.name} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-200">{u.name} {uid === meeting.hostId && <span className="text-xs text-primary-400">(Host)</span>}</p>
                    <p className={`text-xs font-medium ${s.color}`}>{s.icon} {status.replace('_', ' ')}</p>
                    {rsvp?.reason && <p className="text-xs text-gray-500">{rsvp.reason}{rsvp.notes ? ` — ${rsvp.notes}` : ''}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Join Requests (host only) */}
        {isHost && (meeting.joinRequests || []).length > 0 && (
          <div className="card p-5">
            <h2 className="font-semibold text-gray-100 mb-4">Join Requests ({meeting.joinRequests.length})</h2>
            <div className="space-y-3">
              {meeting.joinRequests.map(req => {
                const u = getUser(req.userId);
                return (
                  <div key={req.userId} className="flex items-center gap-3">
                    <Avatar name={u?.name} size="sm" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-200">{u?.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{req.status}</p>
                    </div>
                    {req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleJoinApproval(req.userId, true)} className="p-1.5 rounded text-emerald-400 hover:bg-emerald-900/20 transition-colors"><CheckCircle size={14} /></button>
                        <button onClick={() => handleJoinApproval(req.userId, false)} className="p-1.5 rounded text-red-400 hover:bg-red-900/20 transition-colors"><XCircle size={14} /></button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
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
    </div>
  );
}
