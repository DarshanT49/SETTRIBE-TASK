import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Building, Calendar, Edit2, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS,  asyncGet, asyncSet } from '../services/storage';
import { Avatar, Badge, Button, Input, Select, StatusBadge, PriorityBadge, Skeleton } from '../components/ui';
import { formatDate, formatRelativeTime } from '../utils/dates';
import toast from 'react-hot-toast';

const DEPARTMENTS = ['Engineering', 'Design', 'QA', 'HR', 'Management'];
const ALL_ROLES = ['admin', 'hr', 'manager', 'employee', 'intern', 'panel'];
const roleColors = {
  admin: 'bg-red-900/40 text-red-400 border border-red-800/50',
  hr: 'bg-orange-900/40 text-orange-400 border border-orange-800/50',
  manager: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/50',
  employee: 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50',
  intern: 'bg-blue-900/40 text-blue-400 border border-blue-800/50',
  panel: 'bg-purple-900/40 text-purple-400 border border-purple-800/50' };

export default function EmployeeProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    (async () => {
    const load = async () => {
      await new Promise(r => setTimeout(r, 200));
      const users = await asyncGet(KEYS.USERS) || [];
      const emp = users.find(u => u.id === id);
      if (!emp) { navigate('/employees'); return; }
      setEmployee(emp);
      setEditForm({ name: emp.name, email: emp.email, mobile: emp.mobile, department: emp.department, role: emp.role, employeeId: emp.employeeId });

      const allTasks = await asyncGet(KEYS.TASKS) || [];
      setTasks(allTasks.filter(t => t.assigneeIds.includes(id)));

      const allMeetings = await asyncGet(KEYS.MEETINGS) || [];
      setMeetings(allMeetings.filter(m => m.participantIds.includes(id)));

      const allProjects = await asyncGet(KEYS.PROJECTS) || [];
      setProjects(allProjects.filter(p => p.teamIds.includes(id)));

      setLoading(false);
    };
    load();
  })();
  }, [id]);

  const saveEdit = async () => {
    const users = await asyncGet(KEYS.USERS) || [];
    const idx = users.findIndex(u => u.id === id);
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...editForm };
      asyncSet(KEYS.USERS, users);
      setEmployee(users[idx]);
      toast.success('Profile updated!');
      setEditMode(false);
    }
  };

  if (loading) return <Skeleton className="h-96" />;
  if (!employee) return null;

  const completedTasks = tasks.filter(t => t.status === 'done').length;
  const completion = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  const TABS = ['overview', 'tasks', 'meetings'];
  if (currentUser.role === 'admin') TABS.push('edit');

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Back + Header */}
      <div>
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-300 text-sm mb-4 transition-colors">
          <ArrowLeft size={16} /> Back
        </button>

        <div className="card p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="relative">
              <Avatar name={employee.name} photo={employee.profilePhoto} size="xl" />
              <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${employee.isActive ? 'bg-emerald-500' : 'bg-gray-600'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-100">{employee.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`badge ${roleColors[employee.role]}`}>{employee.role}</span>
                    <span className="text-gray-500 text-sm">{employee.department}</span>
                  </div>
                </div>
                {currentUser.role === 'admin' && (
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      const users = await asyncGet(KEYS.USERS) || [];
                      const idx = users.findIndex(u => u.id === id);
                      if (idx !== -1) { users[idx].isActive = !users[idx].isActive; asyncSet(KEYS.USERS, users); setEmployee(users[idx]); toast.success(`Account ${users[idx].isActive ? 'activated' : 'deactivated'}`); }
                    }} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${employee.isActive ? 'border-red-800/50 text-red-400 hover:bg-red-900/20' : 'border-green-800/50 text-green-400 hover:bg-green-900/20'}`}>
                      {employee.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-400"><Mail size={14} className="text-gray-600" />{employee.email}</div>
                <div className="flex items-center gap-2 text-sm text-gray-400"><Phone size={14} className="text-gray-600" />{employee.mobile || 'N/A'}</div>
                <div className="flex items-center gap-2 text-sm text-gray-400"><Building size={14} className="text-gray-600" />{employee.employeeId}</div>
                <div className="flex items-center gap-2 text-sm text-gray-400"><Calendar size={14} className="text-gray-600" />{formatDate(employee.createdAt)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-2 overflow-x-auto scrollbar-hide">
        {TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-btn capitalize ${activeTab === tab ? 'active' : ''}`}>{tab}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5">
            <h2 className="font-semibold text-gray-100 mb-4">Task Completion</h2>
            <div className="flex items-center justify-between mb-2 text-sm">
              <span className="text-gray-400">{completedTasks} of {tasks.length} tasks completed</span>
              <span className="font-bold text-gray-100">{completion}%</span>
            </div>
            <div className="h-3 bg-gray-800 rounded-full"><div className="h-full bg-primary-600 rounded-full transition-all" style={{ width: `${completion}%` }} /></div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: 'Open', value: tasks.filter(t => !['done'].includes(t.status)).length, color: 'text-blue-400' },
                { label: 'Done', value: completedTasks, color: 'text-emerald-400' },
                { label: 'Overdue', value: tasks.filter(t => !['done'].includes(t.status) && new Date(t.dueDate) < new Date()).length, color: 'text-red-400' },
              ].map(s => (
                <div key={s.label} className="bg-gray-800/50 rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h2 className="font-semibold text-gray-100 mb-4">Assigned Projects</h2>
            {projects.length === 0 ? (
              <p className="text-sm text-gray-500">No projects assigned</p>
            ) : projects.map(p => (
              <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-200">{p.title}</p>
                  <div className="mt-1 h-1.5 bg-gray-700 rounded-full"><div className="h-full bg-primary-600 rounded-full" style={{ width: `${p.progress}%` }} /></div>
                </div>
                <span className="text-xs text-gray-500">{p.progress}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold text-gray-100">All Tasks ({tasks.length})</h2>
          </div>
          {tasks.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No tasks assigned</div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-gray-800">
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3">Task</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {tasks.map(t => (
                  <tr key={t.id} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-sm text-gray-200">{t.title}</td>
                    <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{formatDate(t.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Meetings Tab */}
      {activeTab === 'meetings' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-gray-800">
            <h2 className="font-semibold text-gray-100">Meetings ({meetings.length})</h2>
          </div>
          {meetings.length === 0 ? (
            <div className="py-12 text-center text-gray-500">No meetings found</div>
          ) : (
            <table className="w-full">
              <thead className="border-b border-gray-800">
                <tr className="text-left text-xs text-gray-500 uppercase">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {meetings.map(m => (
                  <tr key={m.id} className="hover:bg-gray-800/30">
                    <td className="px-4 py-3 text-sm text-gray-200">{m.title}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{m.date} {m.time}</td>
                    <td className="px-4 py-3 text-xs text-gray-400 capitalize">{m.type}</td>
                    <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Edit Tab (Admin only) */}
      {activeTab === 'edit' && currentUser.role === 'admin' && (
        <div className="card p-6">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            <Input label="Employee ID" value={editForm.employeeId} onChange={e => setEditForm({ ...editForm, employeeId: e.target.value })} />
            <Input label="Email" type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
            <Input label="Mobile" type="tel" value={editForm.mobile} onChange={e => setEditForm({ ...editForm, mobile: e.target.value })} />
            <Select label="Department" value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })}>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </Select>
            <Select label="Role" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
              {ALL_ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
            </Select>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-800">
            <Button variant="secondary" onClick={() => setActiveTab('overview')}>Cancel</Button>
            <Button onClick={saveEdit}><Save size={14} /> Save Changes</Button>
          </div>
        </div>
      )}
    </div>
  );
}
