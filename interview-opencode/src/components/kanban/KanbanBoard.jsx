import { useState, useRef, useEffect } from 'react';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MessageSquare, Paperclip, AlertCircle, CheckCircle, X, Bold, Italic, Heading, List, ListOrdered, CheckSquare, Code, Link as LinkIcon, Quote, AtSign, Image as ImageIcon, UploadCloud, CircleDot, ChevronDown } from 'lucide-react';
import { KEYS, asyncGet, asyncSet, syncGet } from '../../services/storage';
import { createBulkNotifications } from '../../services/notifications';
import { Avatar, Button, Modal, Input, Select, Textarea, PriorityBadge, StatusBadge, TagInput } from '../ui';
import { formatDate, formatRelativeTime, isOverdue } from '../../utils/dates';
import toast from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const COLUMNS = [
  { id: 'backlog', label: 'Backlog', color: 'text-gray-500' },
  { id: 'todo', label: 'Todo', color: 'text-blue-400' },
  { id: 'in_progress', label: 'In Progress', color: 'text-yellow-400' },
  { id: 'in_review', label: 'In Review', color: 'text-orange-400' },
  { id: 'testing', label: 'Testing', color: 'text-purple-400' },
  { id: 'done', label: 'Done', color: 'text-emerald-400' },
  { id: 'changes_requested', label: 'Changes Requested', color: 'text-red-400' },
];

export function KanbanBoard({ project, tasks, users, currentUser, canManage, onRefresh }) {
  const [activeId, setActiveId] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddTask, setShowAddTask] = useState(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(null);
  const [filterAssignee, setFilterAssignee] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const teamMembers = users.filter(u => project.teamIds?.includes(u.id));
  const filteredTasks = tasks.filter(t => !filterAssignee || t.assigneeIds.includes(filterAssignee));

  const getTasksByStatus = (status) => filteredTasks.filter(t => t.status === status);
  const getUser = (uid) => users.find(u => u.id === uid);
  const activeTask = tasks.find(t => t.id === activeId);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const taskId = active.id;
    const newStatus = over.id;
    if (!COLUMNS.find(c => c.id === newStatus)) return;

    const allTasks = await asyncGet(KEYS.TASKS) || [];
    const idx = allTasks.findIndex(t => t.id === taskId);
    if (idx === -1) return;
    const oldStatus = allTasks[idx].status;
    if (oldStatus === newStatus) return;

    allTasks[idx].status = newStatus;
    asyncSet(KEYS.TASKS, allTasks);

    // Log history
    const history = await asyncGet(KEYS.TASK_HISTORY) || [];
    history.push({ id: uuidv4(), taskId, projectId: project.id, action: 'status_changed', performedBy: currentUser.id, fromStatus: oldStatus, toStatus: newStatus, details: `Status changed from ${oldStatus} to ${newStatus}`, timestamp: new Date().toISOString() });
    asyncSet(KEYS.TASK_HISTORY, history);

    const oldStatusStr = oldStatus;
    toast.success(
      (t) => (
        <div className="flex items-center gap-3">
          <span>Moved to {COLUMNS.find(c => c.id === newStatus)?.label}</span>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              const tasksNow = await asyncGet(KEYS.TASKS) || [];
              const taskIdx = tasksNow.findIndex(tsk => tsk.id === taskId);
              if (taskIdx !== -1) {
                tasksNow[taskIdx].status = oldStatusStr;
                await asyncSet(KEYS.TASKS, tasksNow);
                onRefresh();
                toast.success('Action undone');
              }
            }}
            className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded border border-gray-600 text-white"
          >
            Undo
          </button>
        </div>
      ),
      { duration: 5000 }
    );
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-3">
        <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)} className="input-field w-40 text-sm">
          <option value="">All Assignees</option>
          {teamMembers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
        {canManage && <Button onClick={() => setShowAddTask('backlog')}><Plus size={14} />Add Task</Button>}
      </div>

      {/* Kanban Board */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={e => setActiveId(e.active.id)} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-6 pt-2 scrollbar-thin scrollbar-thumb-gray-800">
          {COLUMNS.map(col => {
            const colTasks = getTasksByStatus(col.id);
            return (
              <DroppableColumn
                key={col.id}
                column={col}
                tasks={colTasks}
                users={users}
                getUser={getUser}
                onTaskClick={setSelectedTask}
                onAddTask={canManage ? () => setShowTemplateSelector(col.id) : null}
              />
            );
          })}
        </div>
        <DragOverlay>
          {activeTask && <TaskCardDragging task={activeTask} users={users} />}
        </DragOverlay>
      </DndContext>

      {/* Task Detail Slider */}
      {selectedTask && (
        <TaskDetailSlider
          task={selectedTask}
          users={users}
          project={project}
          currentUser={currentUser}
          onClose={() => setSelectedTask(null)}
          onRefresh={() => { onRefresh(); setSelectedTask(null); }}
        />
      )}

      {/* Add Task Modal */}
      {showAddTask && (
        <AddTaskModal
          project={project}
          defaultStatus={showAddTask}
          users={users}
          currentUser={currentUser}
          onClose={() => setShowAddTask(null)}
          onSave={(shouldClose = true) => { onRefresh(); if (shouldClose) setShowAddTask(null); }}
        />
      )}

      {/* Task Template Selector */}
      {showTemplateSelector && (
        <TaskTemplateModal
          project={project}
          defaultStatus={showTemplateSelector}
          onClose={() => setShowTemplateSelector(null)}
          onSelectBlank={(status) => {
            setShowTemplateSelector(null);
            setShowAddTask(status);
          }}
        />
      )}
    </div>
  );
}

function DroppableColumn({ column, tasks, users, getUser, onTaskClick, onAddTask }) {
  const { setNodeRef } = useSortable({ id: column.id });

  return (
    <div ref={setNodeRef} className="kanban-column flex flex-col" style={{ minWidth: '280px' }}>
      <div className="p-4 border-b border-gray-800/60 flex items-center justify-between bg-gray-900/20 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold tracking-wide ${column.color}`}>{column.label}</span>
          <span className="text-xs bg-gray-800 text-gray-500 rounded-full px-2 py-0.5">{tasks.length}</span>
        </div>
        {onAddTask && (
          <button onClick={onAddTask} className="p-1 text-gray-600 hover:text-gray-300 hover:bg-gray-700 rounded transition-colors">
            <Plus size={14} />
          </button>
        )}
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-3 space-y-3 min-h-[150px] relative">
          {tasks.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center m-4 rounded-xl border-2 border-dashed border-gray-800 text-gray-500 text-xs text-center p-4">
              No tasks.<br/>Drag one here!
            </div>
          ) : (
            tasks.map(task => (
              <SortableTaskCard key={task.id} task={task} users={users} getUser={getUser} onClick={() => onTaskClick(task)} />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableTaskCard({ task, users, getUser, onClick }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className="task-card select-none group" onClick={onClick}>
      <TaskCardContent task={task} users={users} getUser={getUser} />
      <div className="absolute inset-0 border border-primary-500/0 group-hover:border-primary-500/30 rounded-xl pointer-events-none transition-colors duration-300"></div>
    </div>
  );
}

function TaskCardDragging({ task, users }) {
  const getUser = (uid) => users.find(u => u.id === uid);
  return (
    <div className="task-card shadow-[0_20px_50px_rgba(0,0,0,0.5)] rotate-3 scale-105 w-[280px] border-primary-500/50 bg-gray-800/95 backdrop-blur-xl z-[100]">
      <TaskCardContent task={task} users={users} getUser={getUser} />
    </div>
  );
}

function TaskCardContent({ task, users, getUser }) {
  const overdue = isOverdue(task.dueDate) && !['done'].includes(task.status);
  
  // Get assignee name for the first assignee (since we now enforce single assignee per task in UI)
  const assignee = task.assigneeIds?.length > 0 ? getUser(task.assigneeIds[0]) : null;

  return (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm font-medium text-gray-200 leading-snug line-clamp-2">{task.title}</p>
        <div className="shrink-0 pt-0.5">
          <PriorityBadge priority={task.priority} />
        </div>
      </div>

      {/* Labels / Tags */}
      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {task.tags.map(tag => (
            <span key={tag} className="px-1.5 py-0.5 bg-primary-900/30 text-primary-400 border border-primary-800/30 rounded text-[10px] font-medium">
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Assignee & Status */}
      <div className="flex items-center justify-between mb-3">
        {assignee ? (
          <div className="flex items-center gap-2">
            <Avatar name={assignee.name} size="sm" />
            <span className="text-xs text-gray-300 font-medium truncate max-w-[100px]">{assignee.name}</span>
          </div>
        ) : (
          <div className="text-xs text-gray-500 italic">Unassigned</div>
        )}
        <StatusBadge status={task.status} />
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/50">
        {task.dueDate ? (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${overdue ? 'bg-red-950/50 text-red-400 border border-red-900/50' : 'bg-gray-900/50 text-gray-400 border border-gray-800'} flex items-center gap-1.5`}>
            {overdue ? <AlertCircle size={10} /> : null}
            {formatDate(task.dueDate, 'dd MMM')}
          </span>
        ) : (
          <span className="text-[11px] text-gray-600 font-medium">No Due Date</span>
        )}
        
        <div className="flex items-center gap-3 text-gray-500 text-xs font-medium">
          {task.comments?.length > 0 && <span className="flex items-center gap-1 hover:text-gray-300 transition-colors"><MessageSquare size={12} />{task.comments.length}</span>}
          {task.attachments?.length > 0 && <span className="flex items-center gap-1 hover:text-gray-300 transition-colors"><Paperclip size={12} />{task.attachments.length}</span>}
        </div>
      </div>
    </>
  );
}

function TaskDetailSlider({ task, users, project, currentUser, onClose, onRefresh }) {
  const [comment, setComment] = useState('');
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [delayForm, setDelayForm] = useState({ reason: '', newDueDate: '' });
  const getUser = (uid) => users.find(u => u.id === uid);

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    const allTasks = await asyncGet(KEYS.TASKS) || [];
    const idx = allTasks.findIndex(t => t.id === task.id);
    if (idx !== -1) {
      allTasks[idx].comments = [...(allTasks[idx].comments || []), { id: uuidv4(), userId: currentUser.id, text: comment, createdAt: new Date().toISOString() }];
      asyncSet(KEYS.TASKS, allTasks);
    }
    setComment('');
    toast.success('Comment added');
    onRefresh();
  };

  const handleAction = async (action) => {
    const allTasks = await asyncGet(KEYS.TASKS) || [];
    const idx = allTasks.findIndex(t => t.id === task.id);
    if (idx === -1) return;
    const statusMap = { approve: 'done', reject: 'changes_requested', changes: 'changes_requested' };
    
    const oldStatus = allTasks[idx].status;
    const newStatus = statusMap[action] || oldStatus;
    if (oldStatus === newStatus) return;

    allTasks[idx].status = newStatus;
    asyncSet(KEYS.TASKS, allTasks);
    
    const history = await asyncGet(KEYS.TASK_HISTORY) || [];
    history.push({ id: uuidv4(), taskId: task.id, projectId: project.id, action: `task_${action}d`, performedBy: currentUser.id, fromStatus: oldStatus, toStatus: newStatus, details: `Task ${action}d by ${currentUser.name}`, timestamp: new Date().toISOString() });
    asyncSet(KEYS.TASK_HISTORY, history);
    
    const taskIdStr = task.id;
    const actionPastTense = `${action}d`;

    toast.success(
      (t) => (
        <div className="flex items-center gap-3">
          <span>Task {actionPastTense}!</span>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              const tasksNow = await asyncGet(KEYS.TASKS) || [];
              const taskIdx = tasksNow.findIndex(tsk => tsk.id === taskIdStr);
              if (taskIdx !== -1) {
                tasksNow[taskIdx].status = oldStatus;
                await asyncSet(KEYS.TASKS, tasksNow);
                onRefresh();
                toast.success('Action undone');
              }
            }}
            className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded border border-gray-600 text-white"
          >
            Undo
          </button>
        </div>
      ),
      { duration: 5000 }
    );
    onRefresh();
  };

  const handleDelaySubmit = async () => {
    if (!delayForm.reason || !delayForm.newDueDate) { toast.error('Please fill all fields'); return; }
    const allTasks = await asyncGet(KEYS.TASKS) || [];
    const idx = allTasks.findIndex(t => t.id === task.id);
    if (idx !== -1) { allTasks[idx].delayReason = delayForm.reason; allTasks[idx].newDueDate = delayForm.newDueDate; allTasks[idx].isDelayed = true; asyncSet(KEYS.TASKS, allTasks); }
    toast.success('Delay reason submitted');
    setShowDelayModal(false);
    onRefresh();
  };

  const isAssignee = task.assigneeIds?.includes(currentUser.id);
  const canApprove = ['admin', 'manager'].includes(currentUser.role) || project.ownerId === currentUser.id;
  const taskOverdue = isOverdue(task.dueDate) && task.status !== 'done';
  const taskHistory = (syncGet(KEYS.TASK_HISTORY) || []).filter(h => h.taskId === task.id);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="slide-over z-50">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
          </div>
          <button onClick={onClose} className="p-2 text-gray-500 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-gray-100">{task.title}</h2>
            <p className="text-sm text-gray-400 mt-2">{task.description}</p>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Assignees:</span>
              <div className="flex items-center gap-1.5 mt-1">
                {task.assigneeIds?.map(id => <div key={id} className="flex items-center gap-1"><Avatar name={getUser(id)?.name} size="xs" /><span className="text-xs text-gray-300">{getUser(id)?.name}</span></div>)}
              </div>
            </div>
            <div><span className="text-gray-500">Assigned By:</span><p className="text-gray-300 mt-1">{getUser(task.assignedBy)?.name}</p></div>
            <div><span className="text-gray-500">Start Date:</span><p className="text-gray-300 mt-1">{formatDate(task.startDate)}</p></div>
            <div><span className="text-gray-500">Due Date:</span><p className={`mt-1 ${taskOverdue ? 'text-red-400' : 'text-gray-300'}`}>{formatDate(task.dueDate)} {taskOverdue && '(Overdue!)'}</p></div>
          </div>

          {/* Overdue Alert */}
          {taskOverdue && isAssignee && (
            <div className="p-3 bg-red-900/20 border border-red-800/40 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2"><AlertCircle size={16} className="text-red-400" /><p className="text-sm text-red-400">This task is overdue!</p></div>
              <Button variant="danger" size="sm" onClick={() => setShowDelayModal(true)}>Submit Delay Reason</Button>
            </div>
          )}

          {/* Actions */}
          {canApprove && task.status === 'in_review' && (
            <div className="flex gap-2 p-3 bg-gray-800/50 rounded-lg">
              <Button variant="success" size="sm" onClick={() => handleAction('approve')}><CheckCircle size={12} />Approve</Button>
              <Button variant="danger" size="sm" onClick={() => handleAction('reject')}><X size={12} />Reject</Button>
              <Button variant="secondary" size="sm" onClick={() => handleAction('changes')}>Request Changes</Button>
            </div>
          )}

          {/* Attachments */}
          {task.attachments?.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">Attachments ({task.attachments.length})</p>
              <div className="space-y-1">
                {task.attachments.map((a, i) => (
                  <div key={i} className="flex items-center gap-2 p-2 bg-gray-800/50 rounded">
                    <Paperclip size={12} className="text-primary-400" />
                    <span className="text-xs text-gray-300">{a.name}</span>
                    <span className="text-xs text-gray-600 ml-auto">{a.size}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <p className="text-sm font-medium text-gray-300 mb-3">Comments ({task.comments?.length || 0})</p>
            <div className="space-y-3 mb-3">
              {(task.comments || []).map(c => (
                <div key={c.id} className="flex gap-2">
                  <Avatar name={getUser(c.userId)?.name} size="xs" />
                  <div className="flex-1 bg-gray-800/50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-300">{getUser(c.userId)?.name}</span>
                      <span className="text-xs text-gray-600">{formatRelativeTime(c.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-400">{c.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a comment..." className="input-field flex-1 text-sm" onKeyDown={e => e.key === 'Enter' && handleAddComment()} />
              <Button size="sm" onClick={handleAddComment}>Post</Button>
            </div>
          </div>

          {/* Activity Timeline */}
          {taskHistory.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-300 mb-3">Activity Timeline</p>
              <div className="space-y-2">
                {taskHistory.map(h => (
                  <div key={h.id} className="flex gap-2 text-xs text-gray-500">
                    <span className="text-gray-600">{formatRelativeTime(h.timestamp)}</span>
                    <span className="text-gray-400">{h.details}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delay Modal */}
      {showDelayModal && (
        <Modal isOpen title="Submit Delay Reason" onClose={() => setShowDelayModal(false)} size="sm">
          <div className="p-5 space-y-4">
            <Textarea label="Reason for Delay *" value={delayForm.reason} onChange={e => setDelayForm({ ...delayForm, reason: e.target.value })} />
            <Input label="New Expected Due Date *" type="date" value={delayForm.newDueDate} onChange={e => setDelayForm({ ...delayForm, newDueDate: e.target.value })} />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowDelayModal(false)}>Cancel</Button>
              <Button onClick={handleDelaySubmit}>Submit</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function AddTaskModal({ project, defaultStatus, users, currentUser, onClose, onSave }) {
  const milestones = (syncGet(KEYS.MILESTONES) || []).filter(m => m.projectId === project.id);
  const teamMembers = users.filter(u => project.teamIds?.includes(u.id));

  const PREDEFINED_LABELS = [
    'BE(backend)', 'FE(frontend)', 'feature', 'P0', 'P1', 'P2', 'ppt', 'purchase', 'test', 'treaning', 'documentation'
  ];

  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', status: defaultStatus || 'todo',
    assigneeId: '', milestoneId: '', dueDate: '', tags: [], estimatedHours: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [labelDropdownOpen, setLabelDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [milestoneDropdownOpen, setMilestoneDropdownOpen] = useState(false);
  const [createMore, setCreateMore] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const textareaRef = useRef(null);
  const assigneeDropdownRef = useRef(null);
  const labelDropdownRef = useRef(null);
  const statusDropdownRef = useRef(null);
  const priorityDropdownRef = useRef(null);
  const milestoneDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(event.target)) {
        setAssigneeDropdownOpen(false);
      }
      if (labelDropdownRef.current && !labelDropdownRef.current.contains(event.target)) {
        setLabelDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setStatusDropdownOpen(false);
      }
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target)) {
        setPriorityDropdownOpen(false);
      }
      if (milestoneDropdownRef.current && !milestoneDropdownRef.current.contains(event.target)) {
        setMilestoneDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const insertMarkdown = (prefix, suffix = '') => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = form.description;
    const before = text.substring(0, start);
    const selected = text.substring(start, end);
    const after = text.substring(end, text.length);
    
    setForm({ ...form, description: before + prefix + selected + suffix + after });
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map(f => ({ name: f.name, size: (f.size / 1024).toFixed(1) + ' KB' }));
    setAttachments([...attachments, ...newAttachments]);
  };

  const handleSave = async () => {
    const errors = {};
    if (!form.title.trim()) errors.title = 'Title is required';
    if (!form.assigneeId) errors.assigneeId = 'Assignee is required';
    if (!form.status) errors.status = 'Status is required';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const allTasks = await asyncGet(KEYS.TASKS) || [];
    const newTask = {
      id: uuidv4(),
      projectId: project.id,
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      status: form.status,
      assigneeIds: [form.assigneeId],
      milestoneId: form.milestoneId || null,
      dueDate: form.dueDate || null,
      tags: form.tags,
      estimatedHours: parseFloat(form.estimatedHours) || 0,
      creatorId: currentUser.id,
      assignedBy: currentUser.id,
      attachments: attachments,
      comments: [],
      activityLog: [],
      delayReason: '',
      newDueDate: null,
      isDelayed: false,
      createdAt: new Date().toISOString(),
      startDate: new Date().toISOString().split('T')[0] // Auto-set start date to today
    };
    
    allTasks.push(newTask);
    asyncSet(KEYS.TASKS, allTasks);
    
    createBulkNotifications([form.assigneeId], { 
      type: 'task_assigned', 
      title: 'New Task Assigned', 
      message: `"${newTask.title}" has been assigned to you.`, 
      relatedId: newTask.id, 
      relatedType: 'task' 
    });
    
    const history = await asyncGet(KEYS.TASK_HISTORY) || [];
    history.push({ 
      id: uuidv4(), 
      taskId: newTask.id, 
      projectId: project.id, 
      action: 'created', 
      performedBy: currentUser.id, 
      fromStatus: null, 
      toStatus: form.status, 
      details: `Task created and assigned`, 
      timestamp: new Date().toISOString() 
    });
    asyncSet(KEYS.TASK_HISTORY, history);
    
    toast.success('Task created successfully!');
    if (createMore) {
       setForm({ ...form, title: '', description: '', estimatedHours: '', tags: [] });
       setAttachments([]);
       onSave(false);
    } else {
       onSave(true);
    }
  };

  const selectedAssignee = teamMembers.find(u => u.id === form.assigneeId);

  return (
    <Modal isOpen title="Create new task" onClose={onClose} size="xl" className="p-0 bg-gray-900 border border-gray-800 overflow-hidden flex flex-col h-[90vh]">
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 p-6 space-y-6 flex flex-col overflow-y-auto">
          <div>
            <input 
              type="text" 
              placeholder="Task title" 
              className={`w-full bg-transparent text-2xl font-semibold text-gray-100 placeholder-gray-600 outline-none border-b border-transparent focus:border-primary-500 pb-2 transition-colors ${formErrors.title ? 'border-red-500' : ''}`}
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              autoFocus
            />
            {formErrors.title && <p className="text-xs text-red-400 mt-1">{formErrors.title}</p>}
          </div>

          <div className="flex-1 flex flex-col min-h-[300px]">
            <div className="flex items-center justify-between border border-gray-700 bg-gray-800/50 rounded-t-lg px-2 py-1">
              <div className="flex items-center gap-1">
                <button onClick={() => setIsPreview(false)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${!isPreview ? 'bg-gray-700 text-gray-100' : 'text-gray-400 hover:text-gray-200'}`}>Write</button>
                <button onClick={() => setIsPreview(true)} className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${isPreview ? 'bg-gray-700 text-gray-100' : 'text-gray-400 hover:text-gray-200'}`}>Preview</button>
              </div>
              
              {!isPreview && (
                <div className="flex flex-wrap items-center gap-1 border-l border-gray-700 pl-2">
                  <button onClick={() => insertMarkdown('**', '**')} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded" title="Bold"><Bold size={14}/></button>
                  <button onClick={() => insertMarkdown('*', '*')} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded" title="Italic"><Italic size={14}/></button>
                  <button onClick={() => insertMarkdown('### ')} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded" title="Heading"><Heading size={14}/></button>
                  <div className="w-px h-4 bg-gray-700 mx-1"></div>
                  <button onClick={() => insertMarkdown('- ')} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded" title="Bullet List"><List size={14}/></button>
                  <button onClick={() => insertMarkdown('1. ')} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded" title="Numbered List"><ListOrdered size={14}/></button>
                  <button onClick={() => insertMarkdown('- [ ] ')} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded" title="Checklist"><CheckSquare size={14}/></button>
                  <div className="w-px h-4 bg-gray-700 mx-1"></div>
                  <button onClick={() => insertMarkdown('```\n', '\n```')} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded" title="Code Block"><Code size={14}/></button>
                  <button onClick={() => insertMarkdown('[', '](url)')} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded" title="Link"><LinkIcon size={14}/></button>
                  <button onClick={() => insertMarkdown('> ')} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded" title="Quote"><Quote size={14}/></button>
                  <div className="w-px h-4 bg-gray-700 mx-1"></div>
                  <button onClick={() => insertMarkdown('@')} className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded" title="Mention User"><AtSign size={14}/></button>
                </div>
              )}
            </div>

            {!isPreview ? (
              <textarea
                ref={textareaRef}
                className="flex-1 w-full bg-gray-900 border border-t-0 border-gray-700 rounded-b-lg p-4 text-sm text-gray-200 resize-none focus:outline-none focus:border-primary-500 transition-colors"
                placeholder="Add a description..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            ) : (
              <div className="flex-1 w-full bg-gray-900 border border-t-0 border-gray-700 rounded-b-lg p-4 text-sm text-gray-300 overflow-y-auto whitespace-pre-wrap">
                {form.description || <span className="text-gray-600 italic">Nothing to preview</span>}
              </div>
            )}
          </div>

          <div className="border border-dashed border-gray-700 rounded-lg p-4 flex flex-col items-center justify-center text-center bg-gray-900/50 hover:bg-gray-800 transition-colors relative mt-4">
             <input type="file" multiple className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileUpload} />
             <UploadCloud size={24} className="text-gray-500 mb-2" />
             <p className="text-sm text-gray-400">Attach files by dragging & dropping, selecting or pasting them.</p>
          </div>

          {attachments.length > 0 && (
             <div className="space-y-2 mt-4">
               <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Attachments</p>
               <div className="flex flex-wrap gap-2">
                 {attachments.map((a, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md text-xs text-gray-300">
                      <ImageIcon size={12} className="text-gray-500" />
                      <span>{a.name}</span>
                      <span className="text-gray-500">({a.size})</span>
                      <button onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} className="ml-2 hover:text-red-400">×</button>
                    </div>
                 ))}
               </div>
             </div>
          )}

          {/* Horizontal Metadata Buttons */}
          <div className="pt-4 mt-2">
            <div className="flex flex-wrap gap-2 items-center">
              
              {/* Assignee Button */}
              <div className="relative" ref={assigneeDropdownRef}>
                <button 
                  onClick={() => setAssigneeDropdownOpen(!assigneeDropdownOpen)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border hover:bg-gray-700 rounded-md text-xs font-medium transition-colors ${formErrors.assigneeId ? 'border-red-500 text-red-400' : 'border-gray-700 text-gray-300'}`}
                >
                  <span className="text-gray-500 font-normal">Assignee</span>
                  {selectedAssignee ? (
                    <div className="flex items-center gap-1 ml-1">
                      <Avatar name={selectedAssignee.name} size="xs" />
                      <span className="text-gray-200">{selectedAssignee.name}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">Unassigned</span>
                  )}
                </button>
                {assigneeDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto left-0 bottom-[100%] mb-1">
                    <div className="p-1">
                      {teamMembers.map(opt => (
                        <div 
                          key={opt.id} 
                          className="flex items-center gap-2 px-3 py-2 hover:bg-gray-700 cursor-pointer rounded-md"
                          onClick={() => { setForm({ ...form, assigneeId: opt.id }); setAssigneeDropdownOpen(false); setFormErrors({ ...formErrors, assigneeId: null }); }}
                        >
                          <Avatar name={opt.name} size="xs" />
                          <span className="text-sm text-gray-200">{opt.name}</span>
                        </div>
                      ))}
                      {teamMembers.length === 0 && <div className="px-3 py-2 text-sm text-gray-500">No members.</div>}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Button */}
              <div className="relative" ref={statusDropdownRef}>
                <button 
                  onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-md text-xs font-medium text-gray-300 transition-colors"
                >
                  <span className="text-gray-500 font-normal">Status</span>
                  <span className="text-gray-200 ml-1">{COLUMNS.find(c => c.id === form.status)?.label || 'None'}</span>
                </button>
                {statusDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto left-0 bottom-[100%] mb-1">
                    <div className="p-1">
                      {COLUMNS.map(c => (
                        <div 
                          key={c.id} 
                          className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer text-sm text-gray-200 rounded-md"
                          onClick={() => { setForm({ ...form, status: c.id }); setStatusDropdownOpen(false); }}
                        >
                          {c.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Priority Button */}
              <div className="relative" ref={priorityDropdownRef}>
                <button 
                  onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-md text-xs font-medium text-gray-300 transition-colors"
                >
                  <span className="text-gray-500 font-normal">Priority</span>
                  <span className="text-gray-200 ml-1 capitalize">{form.priority}</span>
                </button>
                {priorityDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-40 bg-gray-800 border border-gray-700 rounded-lg shadow-xl left-0 bottom-[100%] mb-1">
                    <div className="p-1">
                      {['low', 'medium', 'high', 'critical'].map(p => (
                        <div 
                          key={p} 
                          className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer text-sm text-gray-200 rounded-md capitalize"
                          onClick={() => { setForm({ ...form, priority: p }); setPriorityDropdownOpen(false); }}
                        >
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Due Date pseudo-button */}
              <div className="flex items-center bg-gray-800 border border-gray-700 rounded-md px-3 py-1 hover:border-gray-500 transition-colors focus-within:border-primary-500">
                <span className="text-gray-500 text-xs mr-2">Due Date</span>
                <input 
                  type="date" 
                  value={form.dueDate} 
                  onChange={e => setForm({ ...form, dueDate: e.target.value })} 
                  className="bg-transparent text-xs text-gray-200 outline-none w-[110px] cursor-pointer" 
                />
              </div>

              {/* Estimate pseudo-button */}
              <div className="flex items-center bg-gray-800 border border-gray-700 rounded-md px-3 py-1 hover:border-gray-500 transition-colors focus-within:border-primary-500">
                <span className="text-gray-500 text-xs mr-2">Estimate</span>
                <input 
                  type="number" 
                  min="0" step="0.5" 
                  placeholder="0" 
                  value={form.estimatedHours} 
                  onChange={e => setForm({ ...form, estimatedHours: e.target.value })} 
                  className="bg-transparent text-xs text-gray-200 outline-none w-12 text-center" 
                />
                <span className="text-gray-500 text-xs ml-1">hrs</span>
              </div>

              {/* Milestone Button (if any) */}
              {milestones.length > 0 && (
                <div className="relative" ref={milestoneDropdownRef}>
                  <button 
                    onClick={() => setMilestoneDropdownOpen(!milestoneDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-md text-xs font-medium text-gray-300 transition-colors"
                  >
                    <span className="text-gray-500 font-normal">Milestone</span>
                    <span className="text-gray-200 ml-1">{milestones.find(m => m.id === form.milestoneId)?.title || 'None'}</span>
                  </button>
                  {milestoneDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-48 overflow-y-auto left-0 bottom-[100%] mb-1">
                      <div className="p-1">
                        <div 
                          className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer text-sm text-gray-400 rounded-md italic"
                          onClick={() => { setForm({ ...form, milestoneId: '' }); setMilestoneDropdownOpen(false); }}
                        >
                          Clear milestone
                        </div>
                        {milestones.map(m => (
                          <div 
                            key={m.id} 
                            className="px-3 py-1.5 hover:bg-gray-700 cursor-pointer text-sm text-gray-200 rounded-md"
                            onClick={() => { setForm({ ...form, milestoneId: m.id }); setMilestoneDropdownOpen(false); }}
                          >
                            {m.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Add Label Button & Selected Badges */}
              <div className="relative flex items-center gap-2" ref={labelDropdownRef}>
                <button 
                  onClick={() => setLabelDropdownOpen(!labelDropdownOpen)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gray-800 border border-gray-700 hover:bg-gray-700 rounded-md text-xs font-medium text-gray-300 transition-colors"
                >
                  <Plus size={14} className="text-gray-500" />
                  <span>Labels</span>
                </button>

                {labelDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto left-0 bottom-[100%] mb-1">
                    <div className="p-2">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">Apply labels</div>
                      {PREDEFINED_LABELS.map(opt => (
                        <label key={opt} className="flex items-center gap-3 px-2 py-1.5 hover:bg-gray-700 rounded cursor-pointer">
                          <input 
                            type="checkbox" 
                            className="rounded border-gray-600 bg-gray-900 text-primary-600 focus:ring-primary-500"
                            checked={form.tags.includes(opt)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm({ ...form, tags: [...form.tags, opt] });
                              } else {
                                setForm({ ...form, tags: form.tags.filter(t => t !== opt) });
                              }
                            }}
                          />
                          <span className="text-sm text-gray-200">{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Selected Label Badges inline next to Add Label */}
                {form.tags.length > 0 && form.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 bg-primary-900/30 text-primary-400 border border-primary-800/30 rounded text-xs font-medium flex items-center gap-1">
                    {tag}
                    <button onClick={() => setForm({ ...form, tags: form.tags.filter(t => t !== tag) })} className="hover:text-red-400"><X size={12} /></button>
                  </span>
                ))}
              </div>
            </div>
            
            {/* Reporter info */}
            <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
               <span>Reported by:</span>
               <Avatar name={currentUser.name} size="xs" />
               <span className="text-gray-300 font-medium">{currentUser.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="shrink-0 flex items-center justify-between p-4 border-t border-gray-800 bg-gray-900 rounded-b-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" className="rounded border-gray-700 bg-gray-800 text-primary-600 focus:ring-primary-500" checked={createMore} onChange={e => setCreateMore(e.target.checked)} />
          <span className="text-sm text-gray-400">Create more</span>
        </label>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/30">Create Task</Button>
        </div>
      </div>
    </Modal>
  );
}

function TaskTemplateModal({ project, defaultStatus, onClose, onSelectBlank }) {
  return (
    <Modal isOpen title="Create new issue" onClose={onClose} size="md" className="bg-gray-900 border-gray-800">
      <div className="p-5 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-300">Repository</label>
          <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-200 cursor-not-allowed opacity-80">
            <span>{project.name}</span>
            <ChevronDown size={14} className="text-gray-500" />
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-4 space-y-3">
          <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg bg-gray-800/50 hover:border-gray-600 transition-colors group cursor-pointer" onClick={() => onSelectBlank(defaultStatus)}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-emerald-500 bg-emerald-900/20 p-1.5 rounded-md group-hover:bg-emerald-900/40 transition-colors">
                 <CircleDot size={18} />
              </div>
              <div>
                <h4 className="text-base font-medium text-gray-200">Blank issue</h4>
                <p className="text-sm text-gray-500 mt-1">Create an issue from scratch</p>
              </div>
            </div>
            <Button onClick={(e) => { e.stopPropagation(); onSelectBlank(defaultStatus); }} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/30">Get started</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

