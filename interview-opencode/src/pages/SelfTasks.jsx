import { useState, useEffect } from 'react';
import { Plus, Check, Edit, Trash, Search, Bell, BellOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS, asyncGet, asyncSet } from '../services/storage';
import { Button, Modal, Input, Select, Textarea, Toggle, EmptyState, Skeleton } from '../components/ui';
import { formatDate, isOverdue } from '../utils/dates';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const REMINDER_OPTIONS = ['5min', '10min', '30min', '1hr', '1day'];

export default function SelfTasks() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({ title: '', description: '', date: '', time: '', reminder: false, reminderOffset: '30min' });

  const load = async () => {
    const all = await asyncGet(KEYS.SELF_TASKS) || [];
    setTasks(all.filter(t => t.userId === currentUser.id));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [currentUser.id]);

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Task title is required'); return; }
    const all = await asyncGet(KEYS.SELF_TASKS) || [];
    if (editTask) {
      const idx = all.findIndex(t => t.id === editTask.id);
      if (idx !== -1) all[idx] = { ...all[idx], ...form };
    } else {
      all.push({ id: uuidv4(), userId: currentUser.id, ...form, status: 'pending', createdAt: new Date().toISOString() });
    }
    asyncSet(KEYS.SELF_TASKS, all);
    toast.success(editTask ? 'Task updated!' : 'Task added!');
    setShowModal(false);
    setEditTask(null);
    setForm({ title: '', description: '', date: '', time: '', reminder: false, reminderOffset: '30min' });
    load();
  };

  const handleToggleDone = async (taskId) => {
    const all = await asyncGet(KEYS.SELF_TASKS) || [];
    const idx = all.findIndex(t => t.id === taskId);
    if (idx !== -1) { all[idx].status = all[idx].status === 'done' ? 'pending' : 'done'; asyncSet(KEYS.SELF_TASKS, all); }
    load();
  };

  const handleDelete = async (taskId) => {
    const all = await asyncGet(KEYS.SELF_TASKS) || [];
    asyncSet(KEYS.SELF_TASKS, all.filter(t => t.id !== taskId));
    toast.success('Task deleted');
    load();
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({ title: task.title, description: task.description, date: task.date, time: task.time, reminder: task.reminder, reminderOffset: task.reminderOffset || '30min' });
    setShowModal(true);
  };

  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' ? true : filter === 'today' ? t.date === new Date().toISOString().split('T')[0] :
      filter === 'overdue' ? (isOverdue(`${t.date}T${t.time || '23:59'}`) && t.status !== 'done') :
      filter === 'completed' ? t.status === 'done' : true;
    return matchSearch && matchFilter;
  });

  const todo = filtered.filter(t => t.status !== 'done');
  const done = filtered.filter(t => t.status === 'done');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">My To-Dos</h1>
          <p className="text-sm text-gray-500 mt-1">{todo.length} pending · {done.length} done</p>
        </div>
        <Button onClick={() => setShowModal(true)}><Plus size={16} />Add To-Do</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search to-dos..." className="input-field pl-9" />
        </div>
        <div className="flex gap-1">
          {[['all', 'All'], ['today', 'Today'], ['overdue', 'Overdue'], ['completed', 'Completed']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filter === val ? 'bg-primary-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}>{label}</button>
          ))}
        </div>
      </div>

      {loading ? <Skeleton className="h-48" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Todo Column */}
          <div>
            <h2 className="font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400" />To Do ({todo.length})
            </h2>
            {todo.length === 0 ? (
              <EmptyState title="All done! 🎉" description="No pending to-dos" />
            ) : (
              <div className="space-y-3">
                {todo.map(task => <TaskCard key={task.id} task={task} onToggle={handleToggleDone} onEdit={openEdit} onDelete={handleDelete} />)}
              </div>
            )}
          </div>

          {/* Done Column */}
          <div>
            <h2 className="font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />Done ({done.length})
            </h2>
            {done.length === 0 ? (
              <EmptyState title="Nothing completed yet" description="Complete tasks to see them here" />
            ) : (
              <div className="space-y-3">
                {done.map(task => <TaskCard key={task.id} task={task} onToggle={handleToggleDone} onEdit={openEdit} onDelete={handleDelete} />)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} title={editTask ? 'Edit To-Do' : 'Add To-Do'} onClose={() => { setShowModal(false); setEditTask(null); setForm({ title: '', description: '', date: '', time: '', reminder: false, reminderOffset: '30min' }); }}>
        <div className="p-5 space-y-4">
          <Input label="Task Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
            <Input label="Time" type="time" value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} />
          </div>
          <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-gray-400" />
              <span className="text-sm text-gray-300">Reminder</span>
            </div>
            <Toggle checked={form.reminder} onChange={v => setForm({ ...form, reminder: v })} />
          </div>
          {form.reminder && (
            <Select label="Remind me" value={form.reminderOffset} onChange={e => setForm({ ...form, reminderOffset: e.target.value })}>
              <option value="5min">5 minutes before</option>
              <option value="10min">10 minutes before</option>
              <option value="30min">30 minutes before</option>
              <option value="1hr">1 hour before</option>
              <option value="1day">1 day before</option>
            </Select>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowModal(false); setEditTask(null); }}>Cancel</Button>
            <Button onClick={handleSave}>{editTask ? <><Edit size={14} />Update</> : <><Plus size={14} />Add</>}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function TaskCard({ task, onToggle, onEdit, onDelete }) {
  const overdue = task.date && isOverdue(`${task.date}T${task.time || '23:59'}`) && task.status !== 'done';
  return (
    <div className={`card p-4 transition-all ${task.status === 'done' ? 'opacity-60' : ''} ${overdue ? 'border-red-900/50' : ''}`}>
      <div className="flex items-start gap-3">
        <button onClick={() => onToggle(task.id)} className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.status === 'done' ? 'bg-emerald-600 border-emerald-600' : 'border-gray-600 hover:border-primary-500'}`}>
          {task.status === 'done' && <Check size={10} className="text-white" />}
        </button>
        <div className="flex-1">
          <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-200'}`}>{task.title}</p>
          {task.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{task.description}</p>}
          {task.date && (
            <p className={`text-xs mt-1.5 ${overdue ? 'text-red-400 font-medium' : 'text-gray-500'}`}>
              {task.date}{task.time ? ` at ${task.time}` : ''}
              {overdue && ' (Overdue!)'}
            </p>
          )}
          {task.reminder && <div className="flex items-center gap-1 mt-1"><Bell size={10} className="text-primary-400" /><span className="text-xs text-primary-400">{task.reminderOffset} before</span></div>}
        </div>
        <div className="flex gap-1">
          <button onClick={() => onEdit(task)} className="p-1 text-gray-600 hover:text-gray-300 transition-colors rounded"><Edit size={12} /></button>
          <button onClick={() => onDelete(task.id)} className="p-1 text-gray-600 hover:text-red-400 transition-colors rounded"><Trash size={12} /></button>
        </div>
      </div>
    </div>
  );
}
