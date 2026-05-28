import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS, asyncGet, apiPost } from '../services/storage';
import { createBulkNotifications } from '../services/notifications';
import { Button, Input, Select, Textarea, TagInput } from '../components/ui';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const CATEGORIES = ['Web', 'Mobile', 'Internal', 'R&D', 'Other'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];
const STATUSES = ['planning', 'active'];

export default function NewProject() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', clientName: '', category: 'Web', priority: 'medium', status: 'planning',
    startDate: '', endDate: '', deadline: '', technologies: [], tags: [], repoLink: '',
    ownerId: '', managerId: '', teamIds: [] });
  const [milestones, setMilestones] = useState([{ title: '', description: '', targetDate: '' }]);

  useEffect(() => {
    (async () => {
    const us = await asyncGet(KEYS.USERS) || [];
    setUsers(us.filter(u => u.isActive && u.isApproved));
    // Default owner to self if employee
    if (['employee', 'manager'].includes(currentUser.role)) {
      setForm(f => ({ ...f, ownerId: currentUser.id }));
    }
  })();
  }, []);

  const addMilestone = () => setMilestones([...milestones, { title: '', description: '', targetDate: '' }]);
  const removeMilestone = (idx) => setMilestones(milestones.filter((_, i) => i !== idx));
  const updateMilestone = (idx, field, value) => {
    const ms = [...milestones];
    ms[idx] = { ...ms[idx], [field]: value };
    setMilestones(ms);
  };

  const toggleTeamMember = (uid) => {
    setForm(f => ({ ...f, teamIds: f.teamIds.includes(uid) ? f.teamIds.filter(id => id !== uid) : [...f.teamIds, uid] }));
  };

  const handleSubmit = async () => {
    if (!form.title || !form.startDate || !form.endDate) { toast.error('Title, start date and end date are required'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 300));

    const projectId = uuidv4();
    const teamIds = [...new Set([...(form.teamIds), form.ownerId, form.managerId].filter(Boolean))];

    const project = {
      id: projectId,
      title: form.title,
      description: form.description,
      clientName: form.clientName,
      category: form.category,
      priority: form.priority,
      status: form.status,
      ownerId: form.ownerId,
      managerId: form.managerId,
      startDate: form.startDate,
      endDate: form.endDate,
      deadline: form.deadline,
      repoLink: form.repoLink,
      teamIds,
      progress: 0,
      createdAt: new Date().toISOString(),
    };

    await apiPost(KEYS.PROJECTS, project);

    // Create milestones
    await Promise.all(
      milestones.filter(m => m.title).map((m, idx) =>
        apiPost(KEYS.MILESTONES, {
          id: uuidv4(), projectId,
          title: m.title, description: m.description, targetDate: m.targetDate,
          actualDate: null, status: idx === 0 ? 'active' : 'upcoming',
          isLocked: idx === 0, delayDays: 0, delayReason: '', delayedAt: null,
          rescheduledDate: null, completionPct: 0, milestoneOrder: idx + 1,
        })
      )
    );

    // Create initial requirement
    await apiPost(KEYS.PROJECT_REQUIREMENTS, {
      id: uuidv4(), projectId, version: '1.0', title: 'Initial Requirements',
      description: '', addedBy: currentUser.id, addedAt: new Date().toISOString(),
      type: 'initial', clientChangeNote: '',
    });

    // Log history
    await apiPost(KEYS.PROJECT_HISTORY, {
      id: uuidv4(), projectId, action: 'project_created',
      performedBy: currentUser.id, targetId: projectId, targetType: 'project',
      details: `Project "${form.title}" created`, timestamp: new Date().toISOString(),
    });

    // Notify team
    createBulkNotifications(teamIds, {
      type: 'project_added', title: 'Added to Project',
      message: `You've been added to the "${form.title}" project`,
      relatedId: projectId, relatedType: 'project',
    });

    toast.success('Project created successfully!');
    navigate(`/projects/${projectId}`);
    setLoading(false);
  };

  const eligibleOwners = users.filter(u => ['employee', 'manager'].includes(u.role));
  const eligibleManagers = users.filter(u => u.role === 'manager');

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-4 transition-colors">
          <ArrowLeft size={16} />Back
        </button>
        <h1 className="text-2xl font-bold text-gray-100">Create New Project</h1>
      </div>

      {/* Section 1: Basic Info */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-100 mb-4 flex items-center gap-2"><span className="w-6 h-6 bg-primary-600 rounded-full text-white text-xs flex items-center justify-center">1</span>Basic Information</h2>
        <div className="space-y-4">
          <Input label="Project Name *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Description *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input label="Client Name" value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} />
            <Select label="Category" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <Select label="Priority" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              {PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
            </Select>
            <Select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
              {STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </Select>
            <Input label="Start Date *" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
            <Input label="End Date *" type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} />
            <Input label="Hard Deadline" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
            <Input label="Repository Link" type="url" value={form.repoLink} onChange={e => setForm({ ...form, repoLink: e.target.value })} placeholder="https://github.com/..." />
          </div>
          <TagInput label="Technology Stack" tags={form.technologies} onChange={techs => setForm({ ...form, technologies: techs })} placeholder="Add technology..." />
          <TagInput label="Tags" tags={form.tags} onChange={tags => setForm({ ...form, tags })} placeholder="Add tag..." />
        </div>
      </div>

      {/* Section 2: Team */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-100 mb-4 flex items-center gap-2"><span className="w-6 h-6 bg-primary-600 rounded-full text-white text-xs flex items-center justify-center">2</span>Team</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Select label="Project Owner" value={form.ownerId} onChange={e => setForm({ ...form, ownerId: e.target.value })}>
            <option value="">Select owner</option>
            {eligibleOwners.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
          <Select label="Project Manager" value={form.managerId} onChange={e => setForm({ ...form, managerId: e.target.value })}>
            <option value="">Select manager (optional)</option>
            {eligibleManagers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </Select>
        </div>
        <div>
          <label className="label">Team Members</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {users.filter(u => ['employee', 'intern', 'manager'].includes(u.role)).map(u => (
              <label key={u.id} className="flex items-center gap-2 p-2 hover:bg-gray-800 rounded-lg cursor-pointer">
                <input type="checkbox" checked={form.teamIds.includes(u.id)} onChange={() => toggleTeamMember(u.id)} className="rounded border-gray-600 bg-gray-700 text-primary-600" />
                <span className="text-sm text-gray-300">{u.name}</span>
                <span className="text-xs text-gray-600 capitalize">{u.role}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Section 3: Milestones */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-100 mb-4 flex items-center gap-2"><span className="w-6 h-6 bg-primary-600 rounded-full text-white text-xs flex items-center justify-center">3</span>Milestones</h2>
        <div className="space-y-4">
          {milestones.map((ms, idx) => (
            <div key={idx} className="p-4 bg-gray-800/50 border border-gray-700 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-400">Milestone {idx + 1}</span>
                {milestones.length > 1 && <button onClick={() => removeMilestone(idx)} className="text-gray-600 hover:text-red-400 transition-colors"><Trash size={14} /></button>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <Input label="Title *" value={ms.title} onChange={e => updateMilestone(idx, 'title', e.target.value)} />
                </div>
                <Input label="Target Date" type="date" value={ms.targetDate} onChange={e => updateMilestone(idx, 'targetDate', e.target.value)} />
                <div className="md:col-span-3">
                  <Textarea label="Description" value={ms.description} onChange={e => updateMilestone(idx, 'description', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={addMilestone}><Plus size={14} />Add Milestone</Button>
        </div>
      </div>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
        <Button loading={loading} onClick={handleSubmit}><Plus size={14} />Create Project</Button>
      </div>
    </div>
  );
}
