import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft, Edit, Plus, Lock, AlertTriangle, CheckCircle, Clock,
  MoreVertical, Users, FileText, History, KanbanSquare, Target,
  ChevronDown, Download, Trash, ExternalLink, Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS,  asyncGet, asyncSet } from '../services/storage';
import { createBulkNotifications, createNotification } from '../services/notifications';
import { Avatar, Button, Badge, Modal, Input, Select, Textarea, StatusBadge, PriorityBadge, Skeleton, EmptyState, Toggle } from '../components/ui';
import { formatDate, formatRelativeTime, formatDateTime, rescheduleMilestones, isOverdue } from '../utils/dates';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Target },
  { id: 'requirements', label: 'Requirements', icon: FileText },
  { id: 'milestones', label: 'Milestones', icon: Target },
  { id: 'tasks', label: 'Tasks', icon: KanbanSquare },
  { id: 'meetings', label: 'Meetings', icon: Clock },
  { id: 'files', label: 'Files', icon: FileText },
  { id: 'history', label: 'History', icon: History },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [project, setProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showDelayModal, setShowDelayModal] = useState(null);
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [showChangeReqModal, setShowChangeReqModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);

  const load = useCallback(async () => {
    await new Promise(r => setTimeout(r, 200));
    const projs = await asyncGet(KEYS.PROJECTS) || [];
    const proj = projs.find(p => p.id === id);
    if (!proj) { navigate('/projects'); return; }
    setProject(proj);
    setUsers(await asyncGet(KEYS.USERS) || []);
    const ms = (await asyncGet(KEYS.MILESTONES) || []).filter(m => m.projectId === id).sort((a, b) => a.order - b.order);
    setMilestones(ms);
    setTasks((await asyncGet(KEYS.TASKS) || []).filter(t => t.projectId === id));
    setRequirements((await asyncGet(KEYS.PROJECT_REQUIREMENTS) || []).filter(r => r.projectId === id));
    setMeetings((await asyncGet(KEYS.MEETINGS) || []).filter(m => m.projectId === id));
    setHistory((await asyncGet(KEYS.PROJECT_HISTORY) || []).filter(h => h.projectId === id).reverse());
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Skeleton className="h-96" />;
  if (!project) return null;

  const getUser = (uid) => users.find(u => u.id === uid);
  const isOwner = project.ownerId === currentUser.id;
  const isManager = project.managerId === currentUser.id;
  const isAdmin = currentUser.role === 'admin';
  const canManage = isAdmin || isOwner || isManager;

  const handleMarkComplete = async (ms) => {
    const allMs = await asyncGet(KEYS.MILESTONES) || [];
    const idx = allMs.findIndex(m => m.id === ms.id);
    if (idx !== -1) {
      allMs[idx] = { ...allMs[idx], status: 'completed', actualDate: new Date().toISOString(), completionPct: 100 };
      // Activate next milestone
      const nextIdx = allMs.findIndex(m => m.projectId === id && m.order === ms.order + 1);
      if (nextIdx !== -1) { allMs[nextIdx] = { ...allMs[nextIdx], status: 'active', isLocked: true }; }
      asyncSet(KEYS.MILESTONES, allMs);
    }
    // Log history
    const h = await asyncGet(KEYS.PROJECT_HISTORY) || [];
    h.push({ id: uuidv4(), projectId: id, action: 'milestone_completed', performedBy: currentUser.id, targetId: ms.id, targetType: 'milestone', details: `Milestone "${ms.title}" marked as completed`, timestamp: new Date().toISOString() });
    asyncSet(KEYS.PROJECT_HISTORY, h);
    createBulkNotifications(project.teamIds, { type: 'milestone_completed', title: 'Milestone Completed', message: `"${ms.title}" has been completed in ${project.title}`, relatedId: id, relatedType: 'project' });
    toast.success('Milestone marked as completed!');
    load();
  };

  const handleMarkDelayed = async (ms, reason, days) => {
    const allMs = await asyncGet(KEYS.MILESTONES) || [];
    const idx = allMs.findIndex(m => m.id === ms.id);
    if (idx !== -1) { allMs[idx] = { ...allMs[idx], status: 'delayed', delayDays: parseInt(days), delayReason: reason, delayedAt: new Date().toISOString() }; }
    // Reschedule subsequent milestones
    const rescheduled = rescheduleMilestones(allMs.filter(m => m.projectId === id), ms.id, parseInt(days));
    rescheduled.forEach(rm => { const i = allMs.findIndex(m => m.id === rm.id); if (i !== -1) allMs[i] = rm; });
    asyncSet(KEYS.MILESTONES, allMs);
    const upcoming = rescheduled.filter(m => m.status === 'upcoming' && m.id !== ms.id).length;
    toast.success(`Delayed by ${days} days. ${upcoming} milestones rescheduled.`);
    createBulkNotifications(project.teamIds, { type: 'milestone_delayed', title: 'Milestone Delayed', message: `"${ms.title}" delayed by ${days} days. Subsequent milestones rescheduled.`, relatedId: id, relatedType: 'project' });
    setShowDelayModal(null);
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-4 transition-colors">
          <ArrowLeft size={16} /> Back to Projects
        </button>
        <div className="card p-5">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl font-bold text-gray-100">{project.title}</h1>
                <StatusBadge status={project.status} />
                <PriorityBadge priority={project.priority} />
              </div>
              <p className="text-sm text-gray-500 mt-1">{project.clientName && `Client: ${project.clientName} · `}{project.category}</p>
              <div className="flex items-center gap-4 mt-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Avatar name={getUser(project.ownerId)?.name} size="xs" />
                  <span className="text-xs text-gray-500">Owner: {getUser(project.ownerId)?.name}</span>
                </div>
                {project.managerId && (
                  <div className="flex items-center gap-2">
                    <Avatar name={getUser(project.managerId)?.name} size="xs" />
                    <span className="text-xs text-gray-500">Manager: {getUser(project.managerId)?.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Users size={12} />
                  {project.teamIds?.length} members
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-100">{project.progress}%</p>
                <p className="text-xs text-gray-500">Complete</p>
              </div>
              <div className="w-32 h-2 bg-gray-800 rounded-full">
                <div className="h-full bg-primary-600 rounded-full" style={{ width: `${project.progress}%` }} />
              </div>
              {canManage && <Link to={`/projects/${id}/edit`}><Button variant="secondary" size="sm"><Edit size={12} /> Edit</Button></Link>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-2 overflow-x-auto scrollbar-hide">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button key={tabId} onClick={() => setActiveTab(tabId)}
            className={`flex items-center gap-2 tab-btn ${activeTab === tabId ? 'active' : ''}`}>
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab project={project} users={users} tasks={tasks} meetings={meetings} getUser={getUser} canManage={canManage} onAddMember={() => setShowAddMemberModal(true)} onRefresh={load} />}
      {activeTab === 'requirements' && <RequirementsTab requirements={requirements} users={users} canManage={canManage} projectId={id} onRefresh={load} project={project} />}
      {activeTab === 'milestones' && <MilestonesTab milestones={milestones} canManage={canManage} onMarkComplete={handleMarkComplete} onMarkDelayed={(ms) => setShowDelayModal(ms)} onAddMilestone={() => setShowMilestoneModal(true)} />}
      {activeTab === 'tasks' && <KanbanBoard project={project} tasks={tasks} users={users} currentUser={currentUser} canManage={canManage} onRefresh={load} />}
      {activeTab === 'meetings' && <MeetingsTab meetings={meetings} users={users} projectId={id} />}
      {activeTab === 'files' && <FilesTab project={project} tasks={tasks} requirements={requirements} users={users} />}
      {activeTab === 'history' && <HistoryTab history={history} users={users} />}

      {/* Delay Modal */}
      {showDelayModal && (
        <DelayMilestoneModal
          milestone={showDelayModal}
          onClose={() => setShowDelayModal(null)}
          onSubmit={(reason, days) => handleMarkDelayed(showDelayModal, reason, days)}
        />
      )}

      {/* Add Milestone Modal */}
      {showMilestoneModal && (
        <AddMilestoneModal
          projectId={id}
          existingCount={milestones.length}
          onClose={() => setShowMilestoneModal(false)}
          onSave={() => { setShowMilestoneModal(false); load(); }}
        />
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <AddMemberModal
          project={project}
          allUsers={users}
          onClose={() => setShowAddMemberModal(false)}
          onSave={() => { setShowAddMemberModal(false); load(); }}
          currentUserId={currentUser.id}
        />
      )}
    </div>
  );
}

function OverviewTab({ project, users, tasks, meetings, getUser, canManage, onAddMember, onRefresh }) {
  const currentUserId = useAuth().currentUser.id;

  const handleRemoveMember = async (memberId) => {
    const projs = await asyncGet(KEYS.PROJECTS) || [];
    const idx = projs.findIndex(p => p.id === project.id);
    if (idx !== -1) {
      projs[idx].teamIds = projs[idx].teamIds.filter(id => id !== memberId);
      asyncSet(KEYS.PROJECTS, projs);
      toast.success('Member removed');
      onRefresh();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        {/* Project Info */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-100 mb-3">Project Info</h2>
          <p className="text-sm text-gray-400 mb-4">{project.description}</p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Start Date:</span> <span className="text-gray-300">{formatDate(project.startDate)}</span></div>
            <div><span className="text-gray-500">End Date:</span> <span className="text-gray-300">{formatDate(project.endDate)}</span></div>
            {project.deadline && <div><span className="text-gray-500">Deadline:</span> <span className="text-red-400">{formatDate(project.deadline)}</span></div>}
            {project.repoLink && <div><a href={project.repoLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary-400 hover:text-primary-300"><ExternalLink size={12} />Repository</a></div>}
          </div>
          {project.technologies?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {project.technologies.map(t => <span key={t} className="text-xs px-2 py-0.5 bg-gray-800 text-gray-400 rounded">{t}</span>)}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Tasks', value: tasks.length, color: 'text-primary-400' },
            { label: 'Open', value: tasks.filter(t => !['done'].includes(t.status)).length, color: 'text-blue-400' },
            { label: 'Overdue', value: tasks.filter(t => !['done'].includes(t.status) && isOverdue(t.dueDate)).length, color: 'text-red-400' },
            { label: 'Done', value: tasks.filter(t => t.status === 'done').length, color: 'text-emerald-400' },
          ].map(s => (
            <div key={s.label} className="card p-3 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Team Roster */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-100">Team ({project.teamIds?.length})</h2>
          {canManage && <Button size="sm" variant="secondary" onClick={onAddMember}><Plus size={12} />Add</Button>}
        </div>
        <div className="space-y-3">
          {project.teamIds?.map(uid => {
            const u = getUser(uid);
            if (!u) return null;
            const isOwnerMember = uid === project.ownerId;
            return (
              <div key={uid} className="flex items-center gap-3">
                <Avatar name={u.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">{u.name}</p>
                  <div className="flex gap-1">
                    <span className="text-xs text-gray-500 capitalize">{u.role}</span>
                    {isOwnerMember && <span className="text-xs text-yellow-400">· Owner</span>}
                  </div>
                </div>
                {canManage && uid !== project.ownerId && uid !== currentUserId && (
                  <button onClick={() => handleRemoveMember(uid)} className="text-gray-600 hover:text-red-400 transition-colors"><Trash size={12} /></button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function RequirementsTab({ requirements, users, canManage, projectId, onRefresh, project }) {
  const [showModal, setShowModal] = useState(false);
  const initial = requirements.filter(r => r.type === 'initial');
  const changeReqs = requirements.filter(r => r.type === 'change_request');
  const getUser = (uid) => users.find(u => u.id === uid);

  const handleAdd = async (form) => {
    const reqs = await asyncGet(KEYS.PROJECT_REQUIREMENTS) || [];
    const newVersion = `1.${changeReqs.length + 1}`;
    reqs.push({ id: uuidv4(), projectId, version: newVersion, ...form, addedBy: useAuth().currentUser.id, addedAt: new Date().toISOString(), type: 'change_request' });
    asyncSet(KEYS.PROJECT_REQUIREMENTS, reqs);
    createBulkNotifications(project.teamIds, { type: 'requirement_changed', title: 'New Change Request', message: `Client change request "${form.title}" added to ${project.title}`, relatedId: projectId, relatedType: 'project' });
    toast.success('Change request added!');
    setShowModal(false);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Initial Requirements */}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-100 mb-4">Initial Requirements</h2>
        {initial.length === 0 ? <p className="text-sm text-gray-500">No initial requirements defined</p> :
          initial.map(r => (
            <div key={r.id}>
              <p className="text-sm text-gray-300">{r.description}</p>
              {r.title && project.srsDocuments?.map(doc => (
                <div key={doc.name} className="flex items-center gap-2 mt-2 p-2 bg-gray-800/50 rounded-lg">
                  <FileText size={14} className="text-primary-400" />
                  <span className="text-sm text-gray-300">{doc.name}</span>
                  <span className="text-xs text-gray-500">· {doc.size}</span>
                </div>
              ))}
              <p className="text-xs text-gray-600 mt-2">Added by {getUser(r.addedBy)?.name} · {formatRelativeTime(r.addedAt)}</p>
            </div>
          ))}
      </div>

      {/* Change Requests */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-100">Client Change Requests ({changeReqs.length})</h2>
          {canManage && <Button size="sm" onClick={() => setShowModal(true)}><Plus size={12} />Add Change Request</Button>}
        </div>
        {changeReqs.length === 0 ? (
          <p className="text-sm text-gray-500">No change requests yet</p>
        ) : changeReqs.map(r => (
          <div key={r.id} className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg mb-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs px-2 py-0.5 bg-primary-900/40 text-primary-400 rounded border border-primary-800/50">v{r.version}</span>
              <span className="text-sm font-medium text-gray-200">{r.title}</span>
            </div>
            <p className="text-sm text-gray-400">{r.description}</p>
            {r.clientChangeNote && (
              <div className="mt-2 p-2 bg-amber-900/10 border border-amber-800/30 rounded">
                <p className="text-xs text-amber-400">Client note: {r.clientChangeNote}</p>
              </div>
            )}
            <p className="text-xs text-gray-600 mt-2">{getUser(r.addedBy)?.name} · {formatRelativeTime(r.addedAt)}</p>
          </div>
        ))}
      </div>

      {showModal && <AddChangeRequestModal onClose={() => setShowModal(false)} onSave={handleAdd} />}
    </div>
  );
}

function MilestonesTab({ milestones, canManage, onMarkComplete, onMarkDelayed, onAddMilestone }) {
  const [openMenu, setOpenMenu] = useState(null);

  const statusIcon = { upcoming: '🔵', active: '🟡', delayed: '🔴', completed: '✅', locked: '🔒' };

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex justify-end">
          <Button onClick={onAddMilestone}><Plus size={14} />Add Milestone</Button>
        </div>
      )}

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-gray-800" />
        <div className="space-y-4">
          {milestones.map((ms, idx) => (
            <div key={ms.id} className="relative flex gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg flex-shrink-0 z-10 border ${ms.status === 'completed' ? 'bg-emerald-900/40 border-emerald-800/50' : ms.status === 'active' ? 'bg-yellow-900/40 border-yellow-800/50' : ms.status === 'delayed' ? 'bg-red-900/40 border-red-800/50' : 'bg-gray-800 border-gray-700'}`}>
                {statusIcon[ms.status] || statusIcon.upcoming}
              </div>
              <div className="flex-1 card p-4 mb-0">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 font-mono">M{ms.order}</span>
                      <h3 className="font-semibold text-gray-100">{ms.title}</h3>
                      {ms.isLocked && <Lock size={12} className="text-gray-500" />}
                      <StatusBadge status={ms.status} />
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{ms.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                      <span>Target: {formatDate(ms.targetDate)}</span>
                      {ms.actualDate && <span className="text-emerald-400">Completed: {formatDate(ms.actualDate)}</span>}
                      {ms.delayDays > 0 && <span className="text-red-400">Delayed by {ms.delayDays} days</span>}
                    </div>
                    {ms.delayReason && <p className="text-xs text-red-400 mt-1">Reason: {ms.delayReason}</p>}
                  </div>

                  {/* Actions */}
                  {canManage && ms.status !== 'completed' && (
                    <div className="relative">
                      <button onClick={() => setOpenMenu(openMenu === ms.id ? null : ms.id)} className="p-1 text-gray-500 hover:text-gray-300 rounded hover:bg-gray-700">
                        <MoreVertical size={16} />
                      </button>
                      {openMenu === ms.id && (
                        <div className="absolute right-0 top-8 w-44 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
                          {ms.status === 'active' && <button onClick={() => { onMarkComplete(ms); setOpenMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-emerald-400 hover:bg-gray-700 rounded-t-lg flex items-center gap-2"><CheckCircle size={12} />Mark Complete</button>}
                          {ms.status === 'active' && isOverdue(ms.targetDate) && <button onClick={() => { onMarkDelayed(ms); setOpenMenu(null); }} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-gray-700 flex items-center gap-2"><AlertTriangle size={12} />Mark as Delayed</button>}
                          {ms.status === 'upcoming' && <button onClick={() => setOpenMenu(null)} className="w-full text-left px-3 py-2 text-sm text-gray-400 hover:bg-gray-700 rounded-b-lg flex items-center gap-2"><Edit size={12} />Edit</button>}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Completion</span>
                    <span className="text-gray-300">{ms.completionPct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-700 rounded-full">
                    <div className={`h-full rounded-full ${ms.status === 'completed' ? 'bg-emerald-500' : ms.status === 'delayed' ? 'bg-red-500' : 'bg-primary-600'}`} style={{ width: `${ms.completionPct}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
          {milestones.length === 0 && <EmptyState title="No milestones yet" description="Add milestones to track project progress" />}
        </div>
      </div>
    </div>
  );
}

function MeetingsTab({ meetings, users, projectId }) {
  const getUser = (uid) => users.find(u => u.id === uid);
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Link to={`/meetings/new?projectId=${projectId}`}><Button><Plus size={14} />Schedule Meeting</Button></Link>
      </div>
      {meetings.length === 0 ? (
        <EmptyState title="No meetings for this project" description="Schedule a meeting linked to this project" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-gray-800"><tr className="text-left text-xs text-gray-500 uppercase"><th className="px-4 py-3">Title</th><th className="px-4 py-3">Date</th><th className="px-4 py-3">Host</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th></tr></thead>
            <tbody className="divide-y divide-gray-800">
              {meetings.map(m => (
                <tr key={m.id} className="hover:bg-gray-800/30">
                  <td className="px-4 py-3"><Link to={`/meetings/${m.id}`} className="text-sm text-gray-200 hover:text-primary-400">{m.title}</Link></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{m.date} {m.time}</td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar name={getUser(m.hostId)?.name} size="xs" /><span className="text-xs text-gray-400">{getUser(m.hostId)?.name}</span></div></td>
                  <td className="px-4 py-3 text-xs text-gray-400 capitalize">{m.type}</td>
                  <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilesTab({ project, tasks, requirements, users }) {
  const allFiles = [
    ...(project.srsDocuments || []).map(f => ({ ...f, source: 'SRS Document', type: 'document' })),
    ...tasks.flatMap(t => (t.attachments || []).map(a => ({ ...a, source: `Task: ${t.title}`, type: 'attachment' }))),
    ...requirements.flatMap(r => (r.documents || []).map(d => ({ ...d, source: `Change Request: ${r.title}`, type: 'change_request' }))),
  ];
  const getUser = (uid) => users.find(u => u.id === uid);

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-gray-800 flex justify-between">
        <h2 className="font-semibold text-gray-100">All Files ({allFiles.length})</h2>
        <Button size="sm"><Plus size={12} />Upload File</Button>
      </div>
      {allFiles.length === 0 ? (
        <EmptyState title="No files uploaded" description="Upload project documents, SRS files, or task attachments" />
      ) : (
        <table className="w-full">
          <thead className="border-b border-gray-800"><tr className="text-left text-xs text-gray-500 uppercase"><th className="px-4 py-3">Filename</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Uploaded By</th><th className="px-4 py-3">Size</th><th className="px-4 py-3">Date</th></tr></thead>
          <tbody className="divide-y divide-gray-800">
            {allFiles.map((f, i) => (
              <tr key={i} className="hover:bg-gray-800/30">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><FileText size={14} className="text-primary-400" /><span className="text-sm text-gray-200">{f.name}</span></div></td>
                <td className="px-4 py-3 text-xs text-gray-500">{f.source}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{getUser(f.uploadedBy)?.name || 'Unknown'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{f.size || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatDate(f.uploadedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function HistoryTab({ history, users }) {
  const getUser = (uid) => users.find(u => u.id === uid);
  const actionIcons = { project_created: '🚀', member_added: '👤', member_removed: '👋', milestone_completed: '✅', milestone_delayed: '⚠️', task_created: '📋', requirement_changed: '📝', file_uploaded: '📎' };

  return (
    <div className="card p-5">
      <h2 className="font-semibold text-gray-100 mb-4">Project History</h2>
      {history.length === 0 ? (
        <EmptyState title="No history yet" description="Actions performed on this project will appear here" />
      ) : (
        <div className="space-y-4">
          {history.map(h => {
            const actor = getUser(h.performedBy);
            return (
              <div key={h.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm flex-shrink-0">
                  {actionIcons[h.action] || '📌'}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-300">{actor?.name || 'System'}</span>
                      <span className="text-sm text-gray-500"> {h.details}</span>
                    </div>
                    <span className="text-xs text-gray-600 flex-shrink-0 ml-2">{formatRelativeTime(h.timestamp)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper Modals
function DelayMilestoneModal({ milestone, onClose, onSubmit }) {
  const [reason, setReason] = useState('');
  const [days, setDays] = useState('');
  return (
    <Modal isOpen title="Mark Milestone as Delayed" onClose={onClose} size="sm">
      <div className="p-5 space-y-4">
        <p className="text-sm text-gray-400">Marking <span className="font-medium text-gray-200">"{milestone.title}"</span> as delayed will reschedule all subsequent milestones.</p>
        <Textarea label="Delay Reason *" value={reason} onChange={e => setReason(e.target.value)} placeholder="What caused the delay?" />
        <Input label="Number of Days Delayed *" type="number" min="1" value={days} onChange={e => setDays(e.target.value)} placeholder="e.g. 7" />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="danger" onClick={() => { if (!reason || !days) { toast.error('Please fill all fields'); return; } onSubmit(reason, days); }}><AlertTriangle size={14} />Mark Delayed</Button>
        </div>
      </div>
    </Modal>
  );
}

function AddMilestoneModal({ projectId, existingCount, onClose, onSave }) {
  const [form, setForm] = useState({ title: '', description: '', targetDate: '' });
  const handleSave = async () => {
    if (!form.title || !form.targetDate) { toast.error('Title and target date required'); return; }
    const ms = await asyncGet(KEYS.MILESTONES) || [];
    ms.push({ id: uuidv4(), projectId, ...form, actualDate: null, status: 'upcoming', isLocked: false, delayDays: 0, delayReason: '', delayedAt: null, rescheduledDate: null, completionPct: 0, order: existingCount + 1 });
    asyncSet(KEYS.MILESTONES, ms);
    toast.success('Milestone added!');
    onSave();
  };
  return (
    <Modal isOpen title="Add Milestone" onClose={onClose} size="sm">
      <div className="p-5 space-y-4">
        <Input label="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <Textarea label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <Input label="Target Date *" type="date" value={form.targetDate} onChange={e => setForm({ ...form, targetDate: e.target.value })} />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}><Plus size={14} />Add Milestone</Button>
        </div>
      </div>
    </Modal>
  );
}

function AddChangeRequestModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', description: '', clientChangeNote: '' });
  return (
    <Modal isOpen title="Add Change Request" onClose={onClose} size="md">
      <div className="p-5 space-y-4">
        <Input label="Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <Textarea label="Description *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <Textarea label="Client Change Note" value={form.clientChangeNote} onChange={e => setForm({ ...form, clientChangeNote: e.target.value })} placeholder="What the client wants changed..." />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (!form.title || !form.description) { toast.error('Title and description required'); return; } onSave(form); }}><Plus size={14} />Add</Button>
        </div>
      </div>
    </Modal>
  );
}

function AddMemberModal({ project, allUsers, onClose, onSave, currentUserId }) {
  const available = allUsers.filter(u => u.isActive && u.isApproved && !project.teamIds.includes(u.id) && ['manager', 'employee', 'intern'].includes(u.role));
  const [selected, setSelected] = useState([]);
  const handleSave = async () => {
    if (selected.length === 0) { toast.error('Select at least one member'); return; }
    const projs = await asyncGet(KEYS.PROJECTS) || [];
    const idx = projs.findIndex(p => p.id === project.id);
    if (idx !== -1) { projs[idx].teamIds = [...projs[idx].teamIds, ...selected]; asyncSet(KEYS.PROJECTS, projs); }
    createBulkNotifications(selected, { type: 'project_added', title: 'Added to Project', message: `You've been added to the "${project.title}" project`, relatedId: project.id, relatedType: 'project' });
    toast.success(`${selected.length} member(s) added!`);
    onSave();
  };
  return (
    <Modal isOpen title="Add Team Member" onClose={onClose} size="sm">
      <div className="p-5 space-y-3">
        {available.length === 0 ? <p className="text-sm text-gray-500 text-center py-4">No available members to add</p> :
          available.map(u => (
            <label key={u.id} className="flex items-center gap-3 p-2 hover:bg-gray-800 rounded-lg cursor-pointer">
              <input type="checkbox" checked={selected.includes(u.id)} onChange={e => setSelected(e.target.checked ? [...selected, u.id] : selected.filter(id => id !== u.id))} className="rounded border-gray-600 bg-gray-700 text-primary-600" />
              <Avatar name={u.name} size="sm" />
              <div><p className="text-sm text-gray-200">{u.name}</p><p className="text-xs text-gray-500">{u.role} · {u.department}</p></div>
            </label>
          ))
        }
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-800">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}><Plus size={14} />Add {selected.length > 0 ? `(${selected.length})` : ''}</Button>
        </div>
      </div>
    </Modal>
  );
}
