import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, AlertCircle, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS, asyncGet } from '../services/storage';
import { PriorityBadge, StatusBadge, Skeleton, EmptyState, Avatar } from '../components/ui';
import { formatDate, isOverdue } from '../utils/dates';

export default function MyTasks() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('open');
  const [priorityFilter, setPriorityFilter] = useState('');

  useEffect(() => {
    const load = async () => {
      await new Promise(r => setTimeout(r, 200));
      const allTasks = await asyncGet(KEYS.TASKS) || [];
      let ts = allTasks.filter(t => t.assigneeIds.includes(currentUser.id));
      if (statusFilter !== 'all') ts = ts.filter(t => t.status === statusFilter);
      setTasks(ts);
      setProjects(await asyncGet(KEYS.PROJECTS) || []);
      setUsers(await asyncGet(KEYS.USERS) || []);
      setLoading(false);
    };
    load();
  }, [currentUser.id, statusFilter]);

  const getProject = (id) => projects.find(p => p.id === id);
  const getUser = (id) => users.find(u => u.id === id);

  const filtered = tasks.filter(t => {
    const matchStatus = statusFilter === 'all' ? true : statusFilter === 'open' ? !['done'].includes(t.status) : t.status === statusFilter;
    const matchPriority = !priorityFilter || t.priority === priorityFilter;
    return matchStatus && matchPriority;
  }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  const overdueTasks = tasks.filter(t => !['done'].includes(t.status) && isOverdue(t.dueDate));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">My Tasks</h1>
        <p className="text-sm text-gray-500 mt-1">Tasks assigned to you across all projects</p>
      </div>

      {overdueTasks.length > 0 && (
        <div className="p-4 bg-red-900/20 border border-red-800/40 rounded-xl flex items-center gap-3">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400 font-medium">You have {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}! Please submit delay reasons.</p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex gap-1">
          {[['open', 'Open'], ['all', 'All'], ['in_progress', 'In Progress'], ['in_review', 'In Review'], ['done', 'Done']].map(([val, label]) => (
            <button key={val} onClick={() => setStatusFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === val ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}>{label}</button>
          ))}
        </div>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="input-field w-32">
          <option value="">All Priority</option>
          {['critical', 'high', 'medium', 'low'].map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
        </select>
      </div>

      {loading ? <Skeleton className="h-64" lines={5} /> : filtered.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks found" description="You're all caught up!" />
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-gray-800">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3">Task</th>
                <th className="px-4 py-3">Project</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Assigned By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map(t => {
                const proj = getProject(t.projectId);
                const overdue = isOverdue(t.dueDate) && !['done'].includes(t.status);
                return (
                  <tr key={t.id} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      <Link to={`/projects/${t.projectId}`}>
                        <p className="text-sm font-medium text-gray-200 hover:text-primary-400 transition-colors">{t.title}</p>
                        {overdue && <span className="text-xs text-red-400 flex items-center gap-1 mt-0.5"><AlertCircle size={10} />Overdue</span>}
                      </Link>
                    </td>
                    <td className="px-4 py-3"><span className="text-xs text-gray-500">{proj?.title}</span></td>
                    <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-medium" style={{ color: overdue ? '#f87171' : undefined }}>{formatDate(t.dueDate)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar name={getUser(t.assignedBy)?.name} size="xs" />
                        <span className="text-xs text-gray-500">{getUser(t.assignedBy)?.name}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
