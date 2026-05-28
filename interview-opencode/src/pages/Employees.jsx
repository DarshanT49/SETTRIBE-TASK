import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus, Grid, List, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS,  asyncGet, asyncSet } from '../services/storage';
import { createNotification } from '../services/notifications';
import { Avatar, Badge, Button, Modal, Input, Select, StatusBadge, Skeleton, EmptyState } from '../components/ui';
import { formatRelativeTime, formatDate } from '../utils/dates';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const DEPARTMENTS = ['Engineering', 'Design', 'QA', 'HR', 'Management'];
const ALL_ROLES = ['admin', 'hr', 'manager', 'employee', 'intern', 'panel'];

const roleColors = {
  admin: 'bg-red-900/40 text-red-400 border border-red-800/50',
  hr: 'bg-orange-900/40 text-orange-400 border border-orange-800/50',
  manager: 'bg-yellow-900/40 text-yellow-400 border border-yellow-800/50',
  employee: 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/50',
  intern: 'bg-blue-900/40 text-blue-400 border border-blue-800/50',
  panel: 'bg-purple-900/40 text-purple-400 border border-purple-800/50' };

export default function Employees() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [showAddModal, setShowAddModal] = useState(false);

  const load = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 200));
    setUsers(await asyncGet(KEYS.USERS) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) || u.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' && u.isActive && u.isApproved) ||
      (statusFilter === 'inactive' && !u.isActive) || (statusFilter === 'pending' && !u.isApproved);
    const matchRole = !roleFilter || u.role === roleFilter;
    const matchDept = !deptFilter || u.department === deptFilter;
    return matchSearch && matchStatus && matchRole && matchDept;
  });

  const handleToggleStatus = async (userId) => {
    if (currentUser.role !== 'admin') return;
    const all = await asyncGet(KEYS.USERS) || [];
    const idx = all.findIndex(u => u.id === userId);
    if (idx !== -1) {
      all[idx].isActive = !all[idx].isActive;
      asyncSet(KEYS.USERS, all);
      setUsers([...all]);
      toast.success(`Employee ${all[idx].isActive ? 'activated' : 'deactivated'}`);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Employee Directory</h1>
          <p className="text-sm text-gray-500 mt-1">{filtered.length} employees found</p>
        </div>
        {currentUser.role === 'admin' && (
          <Button onClick={() => setShowAddModal(true)}><Plus size={16} /> Add Employee</Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, email, ID..." className="input-field pl-9" />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'inactive', 'pending'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${statusFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}>
              {s === 'pending' ? 'Pending Approval' : s}
            </button>
          ))}
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field w-32">
          <option value="">All Roles</option>
          {ALL_ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
        </select>
        <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="input-field w-36">
          <option value="">All Depts</option>
          {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <div className="flex border border-gray-700 rounded-lg overflow-hidden">
          <button onClick={() => setViewMode('grid')} className={`p-2 ${viewMode === 'grid' ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}><Grid size={16} /></button>
          <button onClick={() => setViewMode('list')} className={`p-2 ${viewMode === 'list' ? 'bg-gray-700 text-gray-100' : 'text-gray-500 hover:text-gray-300'}`}><List size={16} /></button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' : 'space-y-2'}>
          {Array(8).fill(0).map((_, i) => <Skeleton key={i} className={viewMode === 'grid' ? 'h-48' : 'h-16'} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={Users} title="No employees found" description="Try adjusting your search or filters" />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(user => (
            <Link key={user.id} to={`/employees/${user.id}`}
              className="card p-5 hover:border-gray-700 transition-all hover:scale-[1.01] group">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar name={user.name} photo={user.profilePhoto} size="lg" />
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-900 ${user.isActive && user.isApproved ? 'bg-emerald-500' : 'bg-gray-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-100 truncate group-hover:text-primary-400 transition-colors">{user.name}</p>
                  <span className={`badge text-xs ${roleColors[user.role]}`}>{user.role}</span>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-xs text-gray-500">
                <p className="truncate">{user.email}</p>
                <p>{user.department} · {user.employeeId}</p>
              </div>
              {currentUser.role === 'admin' && (
                <div className="mt-3 flex justify-end">
                  <button onClick={e => { e.preventDefault(); handleToggleStatus(user.id); }}
                    className={`text-xs px-2 py-1 rounded border transition-colors ${user.isActive ? 'border-red-800/50 text-red-400 hover:bg-red-900/20' : 'border-green-800/50 text-green-400 hover:bg-green-900/20'}`}>
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-gray-800">
              <tr className="text-left text-xs text-gray-500 uppercase">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map(user => (
                <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/employees/${user.id}`} className="flex items-center gap-3 hover:text-primary-400 transition-colors">
                      <Avatar name={user.name} photo={user.profilePhoto} size="sm" />
                      <div>
                        <p className="font-medium text-gray-200 text-sm">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3"><span className={`badge ${roleColors[user.role]}`}>{user.role}</span></td>
                  <td className="px-4 py-3 text-sm text-gray-400">{user.department}</td>
                  <td className="px-4 py-3 text-sm text-gray-400 font-mono">{user.employeeId}</td>
                  <td className="px-4 py-3">
                    <div className={`flex items-center gap-1.5 text-xs font-medium ${user.isActive && user.isApproved ? 'text-emerald-400' : !user.isApproved ? 'text-yellow-400' : 'text-gray-500'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${user.isActive && user.isApproved ? 'bg-emerald-400' : !user.isApproved ? 'bg-yellow-400' : 'bg-gray-500'}`} />
                      {user.isActive && user.isApproved ? 'Active' : !user.isApproved ? 'Pending' : 'Inactive'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDate(user.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && <AddEmployeeModal onClose={() => setShowAddModal(false)} onSave={() => { load(); setShowAddModal(false); }} />}
    </div>
  );
}

function AddEmployeeModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', employeeId: '', email: '', mobile: '', department: 'Engineering', role: 'employee', password: 'Employee@123', isActive: true });
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!form.name || !form.employeeId || !form.email) { setError('Please fill in required fields'); return; }
    const users = await asyncGet(KEYS.USERS) || [];
    if (users.find(u => u.email === form.email)) { setError('Email already registered'); return; }
    if (users.find(u => u.employeeId === form.employeeId)) { setError('Employee ID already taken'); return; }
    
    const newUser = { id: uuidv4(), ...form, isApproved: true, approvedBy: null, approvedAt: new Date().toISOString(), createdAt: new Date().toISOString(), profilePhoto: null };
    users.push(newUser);
    asyncSet(KEYS.USERS, users);
    toast.success('Employee added successfully!');
    onSave();
  };

  return (
    <Modal isOpen title="Add New Employee" onClose={onClose} size="lg">
      <div className="p-6 space-y-4">
        {error && <div className="p-3 bg-red-900/20 border border-red-800/30 rounded-lg text-red-400 text-sm">{error}</div>}
        <div className="grid grid-cols-2 gap-4">
          <Input label="Full Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <Input label="Employee ID *" value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} />
          <Input label="Email *" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="Mobile" type="tel" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} />
          <Select label="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
            {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
          </Select>
          <Select label="Role" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            {ALL_ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
          </Select>
          <Input label="Password" type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <div className="flex items-center gap-3 mt-6">
            <label className="label mb-0">Status</label>
            <button type="button" onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.isActive ? 'bg-primary-600' : 'bg-gray-700'}`}>
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : ''}`} />
            </button>
            <span className="text-sm text-gray-400">{form.isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}><Plus size={14} /> Add Employee</Button>
        </div>
      </div>
    </Modal>
  );
}
