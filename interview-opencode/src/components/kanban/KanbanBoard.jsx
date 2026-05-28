import { useState } from 'react';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MessageSquare, Paperclip, AlertCircle, CheckCircle, X } from 'lucide-react';
import { KEYS, asyncGet, asyncSet, syncGet } from '../../services/storage';
import { createBulkNotifications } from '../../services/notifications';
import { Avatar, Button, Modal, Input, Select, Textarea, PriorityBadge, StatusBadge } from '../ui';
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

    toast.success(`Task moved to ${COLUMNS.find(c => c.id === newStatus)?.label}`);
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
        <div className="flex gap-3 overflow-x-auto pb-4">
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
                onAddTask={canManage ? () => setShowAddTask(col.id) : null}
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
          onSave={() => { setShowAddTask(null); onRefresh(); }}
        />
      )}
    </div>
  );
}

function DroppableColumn({ column, tasks, users, getUser, onTaskClick, onAddTask }) {
  const { setNodeRef } = useSortable({ id: column.id });

  return (
    <div ref={setNodeRef} className="kanban-column flex flex-col" style={{ minWidth: '260px' }}>
      <div className="p-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${column.color}`}>{column.label}</span>
          <span className="text-xs bg-gray-800 text-gray-500 rounded-full px-2 py-0.5">{tasks.length}</span>
        </div>
        {onAddTask && (
          <button onClick={onAddTask} className="p-1 text-gray-600 hover:text-gray-300 hover:bg-gray-700 rounded transition-colors">
            <Plus size={14} />
          </button>
        )}
      </div>
      <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-2 space-y-2 min-h-32">
          {tasks.map(task => (
            <SortableTaskCard key={task.id} task={task} users={users} getUser={getUser} onClick={() => onTaskClick(task)} />
          ))}
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
      className="task-card select-none" onClick={onClick}>
      <TaskCardContent task={task} users={users} getUser={getUser} />
    </div>
  );
}

function TaskCardDragging({ task, users }) {
  const getUser = (uid) => users.find(u => u.id === uid);
  return (
    <div className="task-card shadow-2xl rotate-2 w-64">
      <TaskCardContent task={task} users={users} getUser={getUser} />
    </div>
  );
}

function TaskCardContent({ task, users, getUser }) {
  const overdue = isOverdue(task.dueDate) && !['done'].includes(task.status);

  return (
    <>
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-200 leading-tight">{task.title}</p>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.assigneeIds?.length > 0 && (
        <div className="flex -space-x-1.5 mb-2">
          {task.assigneeIds.slice(0, 3).map(id => (
            <Avatar key={id} name={getUser(id)?.name} size="xs" className="border border-gray-700" />
          ))}
          {task.assigneeIds.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-gray-700 border border-gray-600 flex items-center justify-center text-xs text-gray-400">+{task.assigneeIds.length - 3}</div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs ${overdue ? 'text-red-400 font-medium' : 'text-gray-500'} flex items-center gap-1`}>
          {overdue && <AlertCircle size={10} />}
          {formatDate(task.dueDate, 'dd MMM')}
        </span>
        <div className="flex items-center gap-2 text-gray-600 text-xs">
          {task.comments?.length > 0 && <span className="flex items-center gap-0.5"><MessageSquare size={10} />{task.comments.length}</span>}
          {task.attachments?.length > 0 && <span className="flex items-center gap-0.5"><Paperclip size={10} />{task.attachments.length}</span>}
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
    allTasks[idx].status = statusMap[action] || allTasks[idx].status;
    asyncSet(KEYS.TASKS, allTasks);
    const history = await asyncGet(KEYS.TASK_HISTORY) || [];
    history.push({ id: uuidv4(), taskId: task.id, projectId: project.id, action: `task_${action}d`, performedBy: currentUser.id, fromStatus: task.status, toStatus: allTasks[idx].status, details: `Task ${action}d by ${currentUser.name}`, timestamp: new Date().toISOString() });
    asyncSet(KEYS.TASK_HISTORY, history);
    toast.success(`Task ${action}d!`);
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
  const sprints = (syncGet(KEYS.SPRINTS) || []).filter(s => s.projectId === project.id);
  const teamMembers = users.filter(u => project.teamIds?.includes(u.id));

  const [form, setForm] = useState({
    title: '', description: '', priority: 'medium', status: defaultStatus,
    assigneeIds: [], milestoneId: '', sprintId: '', startDate: '', dueDate: '' });

  const handleSave = async () => {
    if (!form.title || !form.startDate || !form.dueDate) { toast.error('Title, start date, and due date are required'); return; }
    const allTasks = await asyncGet(KEYS.TASKS) || [];
    const newTask = {
      id: uuidv4(),
      projectId: project.id,
      ...form,
      creatorId: currentUser.id,
      assignedBy: currentUser.id,
      attachments: [],
      comments: [],
      activityLog: [],
      delayReason: '',
      newDueDate: null,
      isDelayed: false,
      createdAt: new Date().toISOString(),
      tags: [] };
    allTasks.push(newTask);
    asyncSet(KEYS.TASKS, allTasks);
    if (form.assigneeIds.length > 0) {
      createBulkNotifications(form.assigneeIds, { type: 'task_assigned', title: 'New Task Assigned', message: `"${form.title}" has been assigned to you. Due: ${formatDate(form.dueDate)}`, relatedId: newTask.id, relatedType: 'task' });
    }
    const history = await asyncGet(KEYS.TASK_HISTORY) || [];
    history.push({ id: uuidv4(), taskId: newTask.id, projectId: project.id, action: 'created', performedBy: currentUser.id, fromStatus: null, toStatus: form.status, details: `Task created and assigned`, timestamp: new Date().toISOString() });
    asyncSet(KEYS.TASK_HISTORY, history);
    toast.success('Task created!');
    onSave();
  };

  const toggleAssignee = (uid) => {
    setForm(f => ({ ...f, assigneeIds: f.assigneeIds.includes(uid) ? f.assigneeIds.filter(id => id !== uid) : [...f.assigneeIds, uid] }));
  };

  return (
    <Modal isOpen title="Add Task" onClose={onClose} size="lg">
      <div className="p-5 space-y-4">
        <Input label="Task Title *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <Textarea label="Description *" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Priority" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
            {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {['backlog', 'todo', 'in_progress'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </Select>
          <Input label="Start Date *" type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
          <Input label="Due Date *" type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
          {milestones.length > 0 && (
            <Select label="Milestone" value={form.milestoneId} onChange={e => setForm({ ...form, milestoneId: e.target.value })}>
              <option value="">No milestone</option>
              {milestones.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </Select>
          )}
          {sprints.length > 0 && (
            <Select label="Sprint" value={form.sprintId} onChange={e => setForm({ ...form, sprintId: e.target.value })}>
              <option value="">No sprint</option>
              {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          )}
        </div>

        {/* Assignees */}
        <div>
          <label className="label">Assign To</label>
          <div className="flex flex-wrap gap-2">
            {teamMembers.map(u => (
              <button key={u.id} type="button" onClick={() => toggleAssignee(u.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border transition-colors ${form.assigneeIds.includes(u.id) ? 'bg-primary-900/40 border-primary-700 text-primary-300' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'}`}>
                <Avatar name={u.name} size="xs" />{u.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave}><Plus size={14} />Create Task</Button>
        </div>
      </div>
    </Modal>
  );
}

