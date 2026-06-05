import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS, asyncGet, apiPost } from '../services/storage';
import { getGroups } from '../services/participantGroups';
import { fetchProjectMembers } from '../services/projectApi';
import { createBulkNotifications } from '../services/notifications';
import { Button, Input, Select, Textarea, Avatar } from '../components/ui';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

export default function NewMeeting() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [projectMemberIds, setProjectMemberIds] = useState([]);
  const [minDate, setMinDate] = useState('');
  const [currentOnlineTime, setCurrentOnlineTime] = useState('');
  const initialProjectId = searchParams.get('projectId') || '';
  const [form, setForm] = useState({
    title: '', agenda: '', date: '', time: '', duration: '60',
    type: initialProjectId ? 'project' : 'general', standupType: 'morning', participantIds: [],
    projectId: initialProjectId
  });

  useEffect(() => {
    (async () => {
      setUsers(await asyncGet(KEYS.USERS) || []);
      setProjects(await asyncGet(KEYS.PROJECTS) || []);
      
      try {
        const fetchedGroups = await getGroups(currentUser.id);
        setMyGroups(fetchedGroups || []);
      } catch (err) {
        console.error("Failed to fetch groups", err);
      }

      try {
        const res = await fetch('https://worldtimeapi.org/api/timezone/Etc/UTC');
        if (res.ok) {
          const data = await res.json();
          const onlineDate = new Date(data.datetime);
          const localYear = onlineDate.getFullYear();
          const localMonth = String(onlineDate.getMonth() + 1).padStart(2, '0');
          const localDay = String(onlineDate.getDate()).padStart(2, '0');
          const localHours = String(onlineDate.getHours()).padStart(2, '0');
          const localMinutes = String(onlineDate.getMinutes()).padStart(2, '0');
          
          setMinDate(`${localYear}-${localMonth}-${localDay}`);
          setCurrentOnlineTime(`${localHours}:${localMinutes}`);
        } else {
          throw new Error('API request failed');
        }
      } catch (err) {
        console.warn("Failed to fetch online time, falling back to system time");
        const now = new Date();
        const localYear = now.getFullYear();
        const localMonth = String(now.getMonth() + 1).padStart(2, '0');
        const localDay = String(now.getDate()).padStart(2, '0');
        const localHours = String(now.getHours()).padStart(2, '0');
        const localMinutes = String(now.getMinutes()).padStart(2, '0');
        
        setMinDate(`${localYear}-${localMonth}-${localDay}`);
        setCurrentOnlineTime(`${localHours}:${localMinutes}`);
      }

      // Auto-include current user
      setForm(f => ({ ...f, participantIds: [currentUser.id] }));
      
      if (initialProjectId) {
         await fetchAndAddProjectMembers(initialProjectId);
      }
    })();
  }, [currentUser.id]);

  const fetchAndAddProjectMembers = async (projectId, isSwitching = false) => {
    if (!projectId) {
      if (isSwitching) {
        setForm(f => ({
          ...f,
          participantIds: f.participantIds.filter(id => !projectMemberIds.includes(String(id)))
        }));
        setProjectMemberIds([]);
      }
      return;
    }
    try {
      const members = await fetchProjectMembers(projectId);
      if (members && members.length > 0) {
        const newIds = members.map(m => String(m.userId));
        setForm(f => {
          let currentIds = f.participantIds.map(String);
          if (isSwitching) {
            currentIds = currentIds.filter(id => !projectMemberIds.includes(id));
          }
          const updatedIds = [...new Set([...currentIds, ...newIds, String(currentUser.id)])];
          return { ...f, participantIds: updatedIds };
        });
        setProjectMemberIds(newIds);
        toast.success(`Auto-selected ${members.length} project member(s)`);
      }
    } catch (err) {
      console.error("Failed to fetch project members for auto-select", err);
    }
  };

  const applyGroup = (groupId) => {
    if (!groupId) return;
    const group = myGroups.find(g => g.id === Number(groupId));
    if (group && group.participantIds) {
      setForm(f => {
        // Merge without duplicates, normalizing to Numbers
        const currentIds = f.participantIds.map(Number);
        const newIds = group.participantIds.map(Number);
        const updatedIds = [...new Set([...currentIds, ...newIds])];
        return { ...f, participantIds: updatedIds };
      });
      toast.success(`Added members of ${group.name}`);
    }
  };

  const handleProjectChange = async (projectId) => {
    setForm(f => ({ ...f, projectId }));
    await fetchAndAddProjectMembers(projectId, true);
  };

  const handleTypeChange = async (type) => {
    setForm(f => ({ ...f, type }));
    if (type === 'project' && form.projectId) {
      await fetchAndAddProjectMembers(form.projectId, true);
    }
  };

  const toggleParticipant = (uid) => {
    const stringUid = String(uid);
    setForm(f => {
      const isSelected = f.participantIds.some(id => String(id) === stringUid);
      return { 
        ...f, 
        participantIds: isSelected 
          ? f.participantIds.filter(id => String(id) !== stringUid) 
          : [...f.participantIds, stringUid] 
      };
    });
  };

  const handleSubmit = async () => {
    if (!form.title || !form.agenda || !form.date || !form.time) { toast.error('Please fill in all required fields'); return; }
    
    if (form.date === minDate && form.time < currentOnlineTime) {
      toast.error('Cannot schedule a meeting in the past');
      return;
    }

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
  const filteredUsers = activeUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (u.role && u.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
          <Input 
            label="Date *" 
            type="date" 
            min={minDate} 
            value={form.date} 
            onChange={e => {
              const newDate = e.target.value;
              let newTime = form.time;
              if (newDate === minDate && newTime && newTime < currentOnlineTime) {
                newTime = currentOnlineTime;
                toast.error("Time adjusted to minimum valid time for today.");
              }
              setForm({ ...form, date: newDate, time: newTime });
            }} 
          />
          <Input 
            label="Time *" 
            type="time" 
            min={form.date === minDate ? currentOnlineTime : undefined} 
            value={form.time} 
            onChange={e => {
              let newTime = e.target.value;
              if (form.date === minDate && newTime < currentOnlineTime) {
                toast.error("Cannot select a past time for today.");
                newTime = currentOnlineTime;
              }
              setForm({ ...form, time: newTime });
            }} 
          />
          <Select label="Duration" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })}>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
            <option value="90">1.5 hours</option>
            <option value="120">2 hours</option>
          </Select>
          <Select label="Meeting Type" value={form.type} onChange={e => handleTypeChange(e.target.value)}>
            <option value="standup">Daily Standup</option>
            <option value="project">Project Discussion</option>
            <option value="general">General</option>
          </Select>
          {form.type === 'project' && projects.length > 0 && (
            <Select label="Link to Project" value={form.projectId} onChange={e => handleProjectChange(e.target.value)}>
              <option value="">No project</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </Select>
          )}
        </div>

        {form.type === 'standup' && (
          <div className="p-4 bg-gray-800/50 rounded-xl">
            <label className="label mb-3">Standup Type</label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={form.standupType === 'morning'} onChange={() => setForm({ ...form, standupType: 'morning' })} className="text-primary-600" />
                <span className="text-sm text-gray-300">Morning (What will you do today?)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={form.standupType === 'evening'} onChange={() => setForm({ ...form, standupType: 'evening' })} className="text-primary-600" />
                <span className="text-sm text-gray-300">Evening (What did you do today?)</span>
              </label>
            </div>
          </div>
        )}



        {/* Participants */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-2">
            <label className="label">Participants</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search participants..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="input-field text-sm pl-9 w-full sm:w-64"
                />
              </div>
              {myGroups.length > 0 && (
                <select 
                  className="input-field text-sm w-full sm:w-64" 
                  onChange={(e) => applyGroup(e.target.value)}
                  defaultValue=""
                >
                  <option value="" disabled>Apply a Group...</option>
                  {myGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.participantIds?.length || 0})</option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
            {filteredUsers.length === 0 ? (
              <div className="col-span-2 md:col-span-3 text-center py-8 text-gray-500 bg-gray-800/30 rounded-xl border border-dashed border-gray-700">
                <p>No participants found matching "{searchTerm}"</p>
              </div>
            ) : (
              filteredUsers.map(u => {
                const isSelected = form.participantIds.some(id => String(id) === String(u.id));
                return (
                  <label key={u.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-primary-900/30 border border-primary-800/50' : 'hover:bg-gray-800 border border-transparent'}`}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleParticipant(u.id)} className="rounded border-gray-600 bg-gray-700 text-primary-600" disabled={u.id === currentUser.id} />
                    <Avatar name={u.name} size="xs" />
                    <div>
                  <p className="text-xs font-medium text-gray-200">{u.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{u.role}</p>
                </div>
              </label>
                );
              })
            )}
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
