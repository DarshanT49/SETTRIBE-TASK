import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Grid, List, FolderOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS, asyncGet } from '../services/storage';
import { Avatar, Button, Badge, StatusBadge, PriorityBadge, Skeleton, EmptyState } from '../components/ui';
import { formatDate } from '../utils/dates';

const STATUSES = ['all', 'planning', 'active', 'completed'];
const PRIORITIES = ['', 'critical', 'high', 'medium', 'low'];

export default function Projects() {
  const { currentUser } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');

  useEffect(() => {
    const load = async () => {
      await new Promise(r => setTimeout(r, 200));
      let projs = await asyncGet(KEYS.PROJECTS) || [];
      const us = await asyncGet(KEYS.USERS) || [];
      // Non-admin users only see their projects
      if (!['admin', 'hr'].includes(currentUser.role)) {
        projs = projs.filter(p => p.teamIds.includes(currentUser.id) || p.ownerId === currentUser.id || p.managerId === currentUser.id);
      }
      setProjects(projs);
      setUsers(us);
      setLoading(false);
    };
    load();
  }, [currentUser]);

  const getUser = (id) => users.find(u => u.id === id);

  const filtered = projects.filter(p => {
    const matchSearch = !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.clientName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchPriority = !priorityFilter || p.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  const canCreate = ['admin', 'manager', 'employee'].includes(currentUser.role);

  const priorityColors = {
    critical: 'bg-red-900/40 text-red-400 border border-red-800/50',
    high: 'bg-orange-900/40 text-orange-400 border border-orange-800/50',
    medium: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/50',
    low: 'bg-blue-900/40 text-blue-400 border border-blue-800/50' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Projects</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} projects</p>
        </div>
        {canCreate && <Link to="/projects/new"><Button><Plus size={16} /> New Project</Button></Link>}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects..." className="input-field pl-9" />
        </div>
        <div className="flex gap-1">
          {STATUSES.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}>{s}</button>
          ))}
        </div>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className="input-field w-32">
          <option value="">All Priority</option>
          {PRIORITIES.filter(Boolean).map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
        </select>
        <div className="flex border border-gray-700 rounded-lg overflow-hidden">
          <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}><Grid size={16} /></button>
          <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}><List size={16} /></button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={FolderOpen} title="No projects found" description="Create your first project or adjust filters"
          action={canCreate ? <Link to="/projects/new"><Button><Plus size={14} />Create Project</Button></Link> : null} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const owner = getUser(p.ownerId);
            return (
              <Link key={p.id} to={`/projects/${p.id}`} className="card p-5 hover:border-gray-700 transition-all hover:scale-[1.01] group flex flex-col gap-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge ${priorityColors[p.priority]}`}>{p.priority}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    <h3 className="font-semibold text-gray-100 group-hover:text-primary-400 transition-colors leading-tight">{p.title}</h3>
                    {p.clientName && <p className="text-xs text-gray-500 mt-0.5">{p.clientName}</p>}
                  </div>
                </div>

                {/* Tags */}
                {p.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.tags.slice(0, 3).map(t => <span key={t} className="text-xs px-1.5 py-0.5 bg-gray-800 text-gray-500 rounded">{t}</span>)}
                  </div>
                )}

                {/* Progress */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-gray-300 font-medium">{p.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full">
                    <div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                  <div className="flex items-center gap-2">
                    <Avatar name={owner?.name} size="xs" />
                    <span className="text-xs text-gray-500">{owner?.name?.split(' ')[0]}</span>
                  </div>
                  <div className="flex -space-x-1">
                    {p.teamIds.slice(0, 3).map(id => <Avatar key={id} name={getUser(id)?.name} size="xs" className="border border-gray-900" />)}
                    {p.teamIds.length > 3 && <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-xs text-gray-400">+{p.teamIds.length - 3}</div>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-gray-800">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3">Project</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Owner</th><th className="px-4 py-3">Progress</th><th className="px-4 py-3">Deadline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <Link to={`/projects/${p.id}`} className="hover:text-primary-400 transition-colors">
                      <p className="text-sm font-medium text-gray-200">{p.title}</p>
                      <p className="text-xs text-gray-500">{p.clientName}</p>
                    </Link>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3"><PriorityBadge priority={p.priority} /></td>
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><Avatar name={getUser(p.ownerId)?.name} size="xs" /><span className="text-xs text-gray-400">{getUser(p.ownerId)?.name}</span></div></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-gray-800 rounded-full w-20"><div className="h-full bg-primary-600 rounded-full" style={{ width: `${p.progress}%` }} /></div>
                      <span className="text-xs text-gray-400">{p.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(p.deadline || p.endDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
