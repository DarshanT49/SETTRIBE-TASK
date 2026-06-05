import { useState, useEffect } from 'react';
   
import { Plus, Check, Edit, Trash, Search, Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { KEYS, asyncGet, asyncSet } from '../services/storage';
import { Button, Modal, Input, Select, Textarea, Toggle, EmptyState, Skeleton } from '../components/ui';
   
import { isOverdue } from '../utils/dates';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { fetchSelfTasksByUserId, createSelfTask, updateSelfTask, deleteSelfTask } from '../services/selfTaskApi';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

   
const REMINDER_OPTIONS = ['5min', '10min', '30min', '1hr', '1day'];

export default function SelfTasks() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [form, setForm] = useState({ title: '', description: '', date: '', startTime: '', endTime: '', reminder: false, reminderOffset: '30min' });

  const load = async () => {
    try {
      const cached = await asyncGet(KEYS.SELF_TASKS);
      if (cached && cached.length > 0) {
        setTasks(cached);
        setLoading(false);
      }
      
      const filteredTasks = await fetchSelfTasksByUserId(currentUser.id);
      setTasks(filteredTasks);
      await asyncSet(KEYS.SELF_TASKS, filteredTasks);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
   
    load();
   
  }, [currentUser.id]);

  useAutoRefresh(load);

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error('Task title is required'); return; }
    if ((form.startTime || form.endTime) && !form.date) {
      toast.error('Date is required when time is set');
      return;
    }
    const todayStr = new Date().toISOString().split('T')[0];
    if (form.date && form.date < todayStr) {
      toast.error('Date cannot be in the past');
      return;
    }
    if (form.date === todayStr && form.startTime) {
      const now = new Date();
      const currentHour = String(now.getHours()).padStart(2, '0');
      const currentMinute = String(now.getMinutes()).padStart(2, '0');
      const currentTimeStr = `${currentHour}:${currentMinute}`;
      if (form.startTime < currentTimeStr) {
        toast.error('Start time cannot be in the past');
        return;
      }
    }
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      toast.error('End time must be after start time');
      return;
    }
    try {
      if (editTask) {
        await updateSelfTask(editTask.id, { ...editTask, ...form });
        toast.success('Task updated!');
      } else {
        await createSelfTask({
          id: uuidv4(),
          userId: String(currentUser.id),
          ...form,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
        toast.success('Task added!');
      }
      setShowModal(false);
      setEditTask(null);
      setForm({ title: '', description: '', date: '', startTime: '', endTime: '', reminder: false, reminderOffset: '30min' });
      load();
    } catch (e) {
      console.error(e);
      toast.error('Failed to save task');
    }
  };

  const handleToggleDone = async (taskId) => {
    const taskToToggle = tasks.find(t => String(t.id) === String(taskId));
    if (!taskToToggle) return;
    try {
      const newStatus = taskToToggle.status === 'done' ? 'pending' : 'done';
      await updateSelfTask(taskId, { ...taskToToggle, status: newStatus });
      load();
    } catch (e) {
      console.error(e);
      toast.error('Failed to update task');
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await deleteSelfTask(taskId);
      toast.success('Task deleted');
      load();
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete task');
    }
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description,
      date: task.date || '',
      startTime: task.startTime || task.time || '',
      endTime: task.endTime || '',
      reminder: task.reminder,
      reminderOffset: task.reminderOffset || '30min'
    });
    setShowModal(true);
  };

  const filtered = tasks.filter(t => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' ? true : filter === 'today' ? t.date === new Date().toISOString().split('T')[0] :
      filter === 'overdue' ? (isOverdue(`${t.date}T${t.startTime || t.time || '23:59'}`) && t.status !== 'done') :
      filter === 'completed' ? t.status === 'done' : true;
    const matchDate = !filterDate || t.date === filterDate;
    return matchSearch && matchFilter && matchDate;
  });

  const todo = filtered.filter(t => t.status !== 'done');
  const done = filtered.filter(t => t.status === 'done');

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const groupedTodo = {
    'Overdue': [],
    'Today': [],
    'Tomorrow': [],
    'No Date': []
  };

  const upcomingKeys = new Set();

  todo.forEach(t => {
    if (!t.date) {
      groupedTodo['No Date'].push(t);
    } else if (isOverdue(`${t.date}T${t.startTime || t.time || '23:59'}`)) {
      groupedTodo['Overdue'].push(t);
    } else if (t.date === todayStr) {
      groupedTodo['Today'].push(t);
    } else if (t.date === tomorrowStr) {
      groupedTodo['Tomorrow'].push(t);
    } else {
      const [y, m, d] = t.date.split('-');
      const dateObj = new Date(y, m - 1, d);
      const formattedDate = `${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (${dateObj.toLocaleDateString('en-US', { weekday: 'long' })})`;
      
      if (!groupedTodo[formattedDate]) {
        groupedTodo[formattedDate] = [];
        upcomingKeys.add(formattedDate);
      }
      groupedTodo[formattedDate].push(t);
    }
  });

  const sortedUpcomingKeys = Array.from(upcomingKeys).sort((a, b) => {
    return new Date(groupedTodo[a][0].date) - new Date(groupedTodo[b][0].date);
  });

  const renderTaskGroup = (title, tasks, titleColor) => {
    if (tasks.length === 0) return null;
    return (
      <div className="mb-6 last:mb-0">
        <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${titleColor}`}>{title} ({tasks.length})</h3>
        <div className="space-y-3">
          {tasks.map(task => <TaskCard key={task.id} task={task} onToggle={handleToggleDone} onEdit={openEdit} onDelete={handleDelete} />)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">My To-Dos</h1>
          <p className="text-sm text-gray-500 mt-1">{todo.length} pending · {done.length} done</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setShowModal(true)}><Plus size={16} />Add To-Do</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search to-dos..." 
            className="input-field pl-10 h-10 text-sm" 
          />
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            className="input-field bg-gray-800 border-gray-700 cursor-pointer w-40 h-10 text-sm"
          >
            <option value="all">All Tasks</option>
            <option value="today">Today</option>
            <option value="overdue">Overdue</option>
            <option value="completed">Completed</option>
          </select>
          <div className="relative flex items-center">
            <input 
              type="date" 
              value={filterDate} 
              onChange={e => setFilterDate(e.target.value)} 
              className="input-field bg-gray-800 border-gray-700 w-44 h-10 text-sm [color-scheme:dark]" 
            />
            {filterDate && (
              <button 
                onClick={() => setFilterDate('')} 
                className="absolute right-8 text-xs font-medium text-gray-400 hover:text-white bg-gray-800 px-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? <Skeleton className="h-48" /> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* Todo Column */}
          <div>
            <h2 className="font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-400" />To Do ({todo.length})
            </h2>
            {todo.length === 0 ? (
              <EmptyState title="All done! 🎉" description="No pending to-dos" />
            ) : (
              <div>
                {renderTaskGroup('Overdue', groupedTodo['Overdue'], 'text-red-400')}
                {renderTaskGroup('Today', groupedTodo['Today'], 'text-blue-400')}
                {renderTaskGroup('Tomorrow', groupedTodo['Tomorrow'], 'text-indigo-400')}
                {sortedUpcomingKeys.map(key => renderTaskGroup(key, groupedTodo[key], 'text-purple-400'))}
                {renderTaskGroup('No Date', groupedTodo['No Date'], 'text-gray-400')}
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
      <Modal isOpen={showModal} title={editTask ? 'Edit To-Do' : 'Add To-Do'} onClose={() => { setShowModal(false); setEditTask(null); setForm({ title: '', description: '', date: '', startTime: '', endTime: '', reminder: false, reminderOffset: '30min' }); }}>
        <div className="p-5 space-y-4">
          <Input label="Task Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Textarea label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
          <Input 
            label="Date" 
            type="date" 
            value={form.date} 
            min={new Date().toISOString().split('T')[0]}
            onChange={e => setForm({ ...form, date: e.target.value })} 
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label="Start Time" 
              type="time" 
              value={form.startTime} 
              min={form.date === new Date().toISOString().split('T')[0] ? (() => {
                const now = new Date();
                return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
              })() : undefined}
              onChange={e => setForm({ ...form, startTime: e.target.value })} 
            />
            <Input 
              label="End Time" 
              type="time" 
              value={form.endTime} 
              min={form.startTime || (form.date === new Date().toISOString().split('T')[0] ? (() => {
                const now = new Date();
                return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
              })() : undefined)}
              onChange={e => setForm({ ...form, endTime: e.target.value })} 
            />
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
  const overdue = task.date && isOverdue(`${task.date}T${task.startTime || task.time || '23:59'}`) && task.status !== 'done';
  return (
    <div className={`card p-4 transition-all ${task.status === 'done' ? 'opacity-60' : ''} ${overdue ? 'border-red-900/50' : ''}`}>
      <div className="flex items-start gap-3">
        <button onClick={() => onToggle(task.id)} className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${task.status === 'done' ? 'bg-emerald-600 border-emerald-600' : 'border-gray-600 hover:border-primary-500'}`}>
          {task.status === 'done' && <Check size={10} className="text-white" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium break-all ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-200'}`}>{task.title}</p>
          {task.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 break-all">{task.description}</p>}
          {task.date && (
            <p className={`text-xs mt-1.5 ${overdue ? 'text-red-400 font-medium' : 'text-gray-500'}`}>
              {task.date}
              {(task.startTime || task.time) ? ` at ${task.startTime || task.time}` : ''}
              {task.endTime ? ` - ${task.endTime}` : ''}
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
