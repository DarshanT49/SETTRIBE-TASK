import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS, asyncGet, apiPost } from '../services/storage';
import { createBulkNotifications } from '../services/notifications';
import { Button, Input, Select, Textarea, Toggle, Avatar } from '../components/ui';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export default function NewMeeting() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', agenda: '', date: '', time: '', duration: '60',
    type: 'general', participantIds: [], meetingMode: 'internal',
    externalLink: '', projectId: searchParams.get('projectId') || '',
    allowJoinRequests: true });

  useEffect(() => {
    (async () => {
    setUsers(await asyncGet(KEYS.USERS) || []);
    setProjects(await asyncGet(KEYS.PROJECTS) || []);
    // Auto-include current user
    setForm(f => ({ ...f, participantIds: [currentUser.id] }));
  })();
  }, []);

  const toggleParticipant = (uid) => {
    setForm(f => ({ ...f, participantIds: f.participantIds.includes(uid) ? f.participantIds.filter(id => id !== uid) : [...f.participantIds, uid] }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.agenda || !form.date || !form.time) { toast.error('Please fill in all required fields'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));

    const meetingId = uuidv4();
    const meeting = {
      id: meetingId,
      ...form,
      hostId: currentUser.id,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
    };

    await apiPost(KEYS.MEETINGS, meeting);

    // Notify all participants (except host)
    const others = form.participantIds.filter(id => id !== currentUser.id);
    createBulkNotifications(others, {
      type: 'meeting_invited',
      title: 'Meeting Invitation',
      message: `You've been invited to "${form.title}" on ${form.date} at ${form.time}`,
      relatedId: meetingId,
      relatedType: 'meeting' });

    toast.success('Meeting scheduled!');
    navigate(`/meetings/${meetingId}`);
    setLoading(false);
  };

  const activeUsers = users.filter(u => u.isActive && u.isApproved);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-4 transition-colors">
          <ArrowLeft size={16} />Back
        </button>
        <h1 className="text-2xl font-bold text-gray-100">Schedule Meeting</h1>
      </div>

      <div className="card p-6 space-y-4">
        <Input label="Meeting Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <Textarea label="Agenda *" value={form.agenda} onChange={e => setForm({ ...form, agenda: e.target.value })} />

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Input label="Date *" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <Input label="Time *" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
          <Select label="Duration" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
          </Select>
          <Select label="Meeting Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
            <option value="standup">Daily Standup</option>
            <option value="project">Project Discussion</option>
            <option value="hr">HR Meeting</option>
            <option value="interview">Interview</option>
            <option value="general">General</option>
          </Select>
          {projects.length > 0 && (
            <Select label="Link to Project" value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}>
              <option value="">No project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </Select>
          )}
        </div>

        {/* Meeting Mode */}
        <div className="p-4 bg-gray-800/50 rounded-xl">
          <label className="label mb-3">Meeting Mode</label>
          <div className="flex gap-4">
            {[['internal', '🖥️ Internal Video Call'], ['external', '🔗 External Link']].map(([val, label]) => (
              <label key={val} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={form.meetingMode === val} onChange={() => setForm({ ...form, meetingMode: val })} className="text-primary-600" />
                <span className="text-sm text-gray-300">{label}</span>
              </label>
            ))}
          </div>
          {form.meetingMode === 'external' && (
            <Input className="mt-3" label="External Link" type="url" value={form.externalLink} onChange={e => setForm({ ...form, externalLink: e.target.value })} placeholder="https://meet.google.com/..." />
          )}
        </div>

        {/* Allow Join Requests */}
        <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
          <div>
            <p className="text-sm text-gray-300">Allow Join Requests</p>
            <p className="text-xs text-gray-500">Non-invited users can request to join</p>
          </div>
          <Toggle checked={form.allowJoinRequests} onChange={v => setForm({ ...form, allowJoinRequests: v })} />
        </div>

        {/* Participants */}
        <div>
          <label className="label mb-3">Participants</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto">
            {activeUsers.map(u => (
              <label key={u.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${form.participantIds.includes(u.id) ? 'bg-primary-900/30 border border-primary-800/50' : 'hover:bg-gray-800 border border-transparent'}`}>
                <input type="checkbox" checked={form.participantIds.includes(u.id)} onChange={() => toggleParticipant(u.id)} className="rounded border-gray-600 bg-gray-700 text-primary-600" disabled={u.id === currentUser.id} />
                <Avatar name={u.name} size="xs" />
                <div>
                  <p className="text-xs font-medium text-gray-200">{u.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{u.role}</p>
                </div>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">{form.participantIds.length} participant(s) selected</p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button loading={loading} onClick={handleSubmit}>Schedule Meeting</Button>
        </div>
      </div>
    </div>
  );
}
