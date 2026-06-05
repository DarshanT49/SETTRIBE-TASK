import { useState, useEffect } from 'react';
   
import { Plus, Check, Edit, Trash, Search, Bell, BellOff, Calendar as CalendarIcon, List as ListIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { startOfWeek, addDays, subWeeks, addWeeks, format, isToday } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { KEYS, asyncGet, asyncSet } from '../services/storage';
import { Button, Modal, Input, Select, Textarea, Toggle, EmptyState, Skeleton } from '../components/ui';
   
import { formatDate, isOverdue } from '../utils/dates';
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
  const [viewMode, setViewMode] = useState('list');
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [form, setForm] = useState({ title: '', description: '', date: '', startTime: '', endTime: '', reminder: false, reminderOffset: '30min' });

  const prevWeek = () => setCurrentWeekStart(prev => subWeeks(prev, 1));
  const nextWeek = () => setCurrentWeekStart(prev => addWeeks(prev, 1));
  const goToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(currentWeekStart, i));

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
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-800 p-1 rounded-lg">
            <button 
              onClick={() => setViewMode('list')} 
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'list' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <ListIcon size={14} /> List View
            </button>
            <button 
              onClick={() => setViewMode('week')} 
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${viewMode === 'week' ? 'bg-gray-700 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}
            >
              <CalendarIcon size={14} /> Weekly Planner
            </button>
          </div>
          <Button onClick={() => setShowModal(true)}><Plus size={16} />Add To-Do</Button>
        </div>
      </div>

      {viewMode === 'list' && (
        <div className="flex flex-wrap gap-3 mb-2">
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
      )}

      {loading ? <Skeleton className="h-48" /> : viewMode === 'week' ? (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-200">
                {format(currentWeekStart, 'MMM d')} - {format(addDays(currentWeekStart, 6), 'MMM d, yyyy')}
              </h2>
            </div>
            <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
              <button onClick={prevWeek} className="p-1 hover:bg-gray-700 rounded text-gray-400" title="Previous Week"><ChevronLeft size={16} /></button>
              <button onClick={goToday} className="px-3 text-sm font-medium text-gray-300 hover:text-white">Today</button>
              <button onClick={nextWeek} className="p-1 hover:bg-gray-700 rounded text-gray-400" title="Next Week"><ChevronRight size={16} /></button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
            {weekDays.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayTasks = tasks.filter(t => t.date === dateStr);
              const isCurrentDay = isToday(day);
              const isPastDay = dateStr < format(new Date(), 'yyyy-MM-dd');
              
              return (
                <div key={dateStr} className={`bg-gray-800/50 rounded-xl p-3 flex flex-col h-full border ${isCurrentDay ? 'border-primary-500/50 bg-primary-900/10' : 'border-gray-700/50'}`}>
                  <div className="text-center pb-3 mb-3 border-b border-gray-700/50">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{format(day, 'EEE')}</p>
                    <p className={`text-xl font-bold mt-1 ${isCurrentDay ? 'text-primary-400' : 'text-gray-200'}`}>
                      {format(day, 'd')}
                    </p>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-2 mb-3 min-h-[150px] max-h-[400px]">
                    {dayTasks.length === 0 ? (
                      <p className="text-xs text-gray-500 text-center italic py-2">No To-Dos</p>
                    ) : (
                      dayTasks.map(task => (
                        <div key={task.id} className={`p-2 rounded bg-gray-900/50 border border-gray-700/50 text-sm transition-opacity hover:border-gray-600 ${task.status === 'done' ? 'opacity-60' : ''}`}>
                          <div className="flex items-start gap-2">
                             <button onClick={(e) => { e.stopPropagation(); handleToggleDone(task.id); }} className={`mt-0.5 w-4 h-4 rounded-full border flex flex-shrink-0 items-center justify-center ${task.status === 'done' ? 'bg-emerald-600 border-emerald-600' : 'border-gray-500 hover:border-primary-500 transition-colors'}`}>
                               {task.status === 'done' && <Check size={10} className="text-white" />}
                             </button>
                             <div className="flex-1 min-w-0 cursor-pointer" onClick={() => openEdit(task)} role="button">
                               <p className={`text-xs font-medium truncate ${task.status === 'done' ? 'line-through text-gray-500' : 'text-gray-300'}`}>{task.title}</p>
                               {(task.startTime || task.time) && (
                                 <p className="text-[10px] text-gray-500 mt-0.5">{task.startTime || task.time}</p>
                               )}
                             </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <Button 
                    variant="secondary" 
                    className={`w-full text-xs py-1.5 ${isPastDay ? 'opacity-50 cursor-not-allowed' : ''}`} 
                    disabled={isPastDay}
                    onClick={() => {
                      if (!isPastDay) {
                        setForm({ title: '', description: '', date: dateStr, startTime: '', endTime: '', reminder: false, reminderOffset: '30min' });
                        setEditTask(null);
                        setShowModal(true);
                      }
                    }}
                  >
                    <Plus size={14} /> Add
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
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
