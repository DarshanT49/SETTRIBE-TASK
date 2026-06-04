import { useState, useEffect } from 'react';
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, MessageSquare, Paperclip, AlertCircle, CheckCircle, X } from 'lucide-react';
import { KEYS, asyncGet, asyncSet, syncGet } from '../../services/storage';
import { fetchTaskHistory, updateTask, createTask, fetchTaskAssignees, addTaskAssignee } from '../../services/taskApi';
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
  const [tasksWithAssignees, setTasksWithAssignees] = useState([]);

  useEffect(() => {
    let active = true;
    const fetchAssignees = async () => {
      try {
        const responses = await Promise.all(
          tasks.map(t => fetchTaskAssignees(t.id).catch(() => []))
        );
        if (active) {
          const merged = tasks.map((t, idx) => ({
            ...t,
            id: String(t.id),
            assigneeIds: responses[idx].map(a => String(a.userId))
          }));
          setTasksWithAssignees(merged);
        }
      } catch (e) {
        console.error("Failed to fetch assignees", e);
        if (active) setTasksWithAssignees(tasks.map(t => ({ ...t, assigneeIds: [] })));
      }
    };
    if (tasks.length > 0) {
      fetchAssignees();
    } else {
      setTasksWithAssignees([]);
    }
    return () => { active = false; };
  }, [tasks]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const teamMembers = users.filter(u => project.teamIds?.map(String).includes(String(u.id)));
  const filteredTasks = tasksWithAssignees.filter(t => !filterAssignee || (t.assigneeIds || []).includes(filterAssignee));

  const getTasksByStatus = (status) => filteredTasks.filter(t => t.status === status);
  const getUser = (uid) => users.find(u => String(u.id) === String(uid));
  const activeTask = tasksWithAssignees.find(t => t.id === activeId);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const taskId = active.id;
    const newStatus = over.id;
    if (!COLUMNS.find(c => c.id === newStatus)) return;

    const allTasks = [...tasksWithAssignees];
    const idx = allTasks.findIndex(t => t.id === taskId);
    if (idx === -1) return;
    const oldStatus = allTasks[idx].status;
    if (oldStatus === newStatus) return;

    allTasks[idx].status = newStatus;
    
    try {
      await updateTask(allTasks[idx].id, allTasks[idx]);
    } catch (e) {
      console.error(e);
      toast.error('Failed to update task status');
      return;
    }

    // History is handled by backend TaskService.update automatically

    const oldStatusStr = oldStatus;
    toast.success(
      (t) => (
        <div className="flex items-center gap-3">
          <span>Moved to {COLUMNS.find(c => c.id === newStatus)?.label}</span>
          <button 
            onClick={async () => {
              toast.dismiss(t.id);
              const taskIdx = allTasks.findIndex(tsk => tsk.id === taskId);
              if (taskIdx !== -1) {
                allTasks[taskIdx].status = oldStatusStr;
                await updateTask(allTasks[taskIdx].id, allTasks[taskIdx]);
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
  const getUser = (uid) => users.find(u => String(u.id) === String(uid));
  return (
    <div className="task-card shadow-[0_20px_50px_rgba(0,0,0,0.5)] rotate-3 scale-105 w-[280px] border-primary-500/50 bg-gray-800/95 backdrop-blur-xl z-[100]">
      <TaskCardContent task={task} users={users} getUser={getUser} />
    </div>
  );
}

   
function TaskCardContent({ task, users, getUser }) {
  const overdue = isOverdue(task.dueDate) && !['done'].includes(task.status);

  return (
    <>
      <div className="flex items-start justify-between gap-3 mb-3">
        <p className="text-sm font-medium text-gray-200 leading-snug line-clamp-2">{task.title}</p>
        <div className="shrink-0 pt-0.5">
          <PriorityBadge priority={task.priority} />
        </div>
      </div>

      {(task.assigneeIds || []).length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {(task.assigneeIds || []).slice(0, 3).map(id => (
            <div key={id} className="flex items-center gap-1.5 bg-gray-800/40 pr-2.5 pl-1 py-1 rounded-full border border-gray-700/50 transition-colors hover:bg-gray-700/50">
              <Avatar name={getUser(id)?.name} size="xs" />
              <span className="text-xs text-gray-300 font-medium">{getUser(id)?.name}</span>
            </div>
          ))}
          {(task.assigneeIds || []).length > 3 && (
            <div className="flex items-center justify-center px-2.5 py-1 bg-gray-800/40 rounded-full border border-gray-700/50 text-[11px] font-medium text-gray-400">
              +{(task.assigneeIds || []).length - 3} more
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-700/50">
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${overdue ? 'bg-red-950/50 text-red-400 border border-red-900/50' : 'bg-gray-900/50 text-gray-400 border border-gray-800'} flex items-center gap-1.5`}>
          {overdue ? <AlertCircle size={10} /> : null}
          {formatDate(task.dueDate, 'dd MMM')}
        </span>
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
  const [taskHistory, setTaskHistory] = useState([]);
  const [showDelayModal, setShowDelayModal] = useState(false);
  const [showLogHoursModal, setShowLogHoursModal] = useState(false);
  const [logHoursForm, setLogHoursForm] = useState({ hours: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [delayForm, setDelayForm] = useState({ reason: '', newDueDate: '' });
  const getUser = (uid) => users.find(u => u.id === uid || u.id === Number(uid));

  useEffect(() => {
    fetchTaskHistory(task.id).then(setTaskHistory).catch(console.error);
  }, [task.id]);

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
    
    // History is handled by backend TaskService.update automatically
    
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

  const handleLogHoursSubmit = async () => {
    if (!logHoursForm.hours || isNaN(logHoursForm.hours)) { toast.error('Please enter valid hours'); return; }
    // Normally call backend: await worklogService.logTime({ taskId: task.id, ... })
    toast.success(`Logged ${logHoursForm.hours} hours!`);
    setShowLogHoursModal(false);
    onRefresh();
  };

  const isAssignee = task.assigneeIds?.includes(String(currentUser.id));
  const canApprove = ['admin', 'manager'].includes(currentUser.role) || String(project.ownerId) === String(currentUser.id);
  const taskOverdue = isOverdue(task.dueDate) && task.status !== 'done';

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
            <div><span className="text-gray-500">Estimated Hours:</span><p className="text-gray-300 mt-1">{task.estimatedHours || 'Not Set'}</p></div>
            {isAssignee && (
               <div>
                 <Button size="sm" variant="secondary" onClick={() => setShowLogHoursModal(true)}>Log Actual Hours</Button>
               </div>
            )}
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
                    <span className="text-gray-600">{formatRelativeTime(h.changedAt)}</span>
                    <span className="text-gray-400">
                      Changed from {h.oldStatus} to {h.newStatus} by {getUser(h.changedByUserId)?.name}
                    </span>
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

      {/* Log Hours Modal */}
      {showLogHoursModal && (
        <Modal isOpen title="Log Actual Hours" onClose={() => setShowLogHoursModal(false)} size="sm">
          <div className="p-5 space-y-4">
            <Input label="Hours Worked *" type="number" step="0.5" min="0" value={logHoursForm.hours} onChange={e => setLogHoursForm({ ...logHoursForm, hours: e.target.value })} />
            <Input label="Date *" type="date" value={logHoursForm.date} onChange={e => setLogHoursForm({ ...logHoursForm, date: e.target.value })} />
            <Textarea label="Description (Optional)" value={logHoursForm.description} onChange={e => setLogHoursForm({ ...logHoursForm, description: e.target.value })} />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowLogHoursModal(false)}>Cancel</Button>
              <Button onClick={handleLogHoursSubmit}>Log Time</Button>
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
    title: '', description: '', priority: 'medium', status: defaultStatus, estimatedHours: '',
    assigneeIds: [], milestoneId: '', sprintId: '', startDate: '', dueDate: '' });
  const [formErrors, setFormErrors] = useState({});

  const handleSave = async () => {
    const errors = {};
    if (!form.title) errors.title = 'Title is required';
    if (!form.startDate) errors.startDate = 'Start date is required';
    if (!form.dueDate) errors.dueDate = 'Due date is required';
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const apiTaskPayload = {
      projectId: project.id,
      title: form.title,
      description: form.description,
      priority: form.priority,
      status: form.status,
      // estimatedHours: form.estimatedHours ? Number(form.estimatedHours) : null,
      milestoneId: form.milestoneId || null,
      sprintId: form.sprintId || null,
      startDate: form.startDate,
      dueDate: form.dueDate,
      creatorId: currentUser.id,
      assignedBy: currentUser.id,
      delayReason: '',
      newDueDate: null,
      isDelayed: false,
      createdAt: new Date().toISOString()
    };
    
    let createdTask;
    try {
      createdTask = await createTask(apiTaskPayload);
    } catch (e) {
      console.error("Failed to create task", e);
      toast.error('Failed to create task');
      return;
    }
    
    // Add assignees via API
    try {
      for (const uid of form.assigneeIds) {
        await addTaskAssignee(createdTask.id, uid);
      }
    } catch (e) {
      console.error("Failed to save task assignees", e);
    }
    
    if (form.assigneeIds.length > 0) {
      createBulkNotifications(form.assigneeIds, { type: 'task_assigned', title: 'New Task Assigned', message: `"${form.title}" has been assigned to you. Due: ${formatDate(form.dueDate)}`, relatedId: createdTask.id, relatedType: 'task' });
    }
    // History is handled by backend TaskService automatically
    toast.success('Task created!');
    onSave();
  };

  const toggleAssignee = (uid) => {
    setForm(f => ({ ...f, assigneeIds: f.assigneeIds.includes(uid) ? f.assigneeIds.filter(id => id !== uid) : [...f.assigneeIds, uid] }));
  };

  return (
    <Modal isOpen title="Add Task" onClose={onClose} size="lg">
      <div className="p-5 space-y-4">
        <Input label="Task Title *" error={formErrors.title} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <Textarea label="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-4">
          <Select label="Priority" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
            {['low', 'medium', 'high', 'critical'].map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
          </Select>
          <Select label="Status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
            {['backlog', 'todo', 'in_progress'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
          </Select>
          <Input label="Estimated Hours" type="number" step="0.5" min="0" value={form.estimatedHours} onChange={e => setForm({ ...form, estimatedHours: e.target.value })} />
          <Input label="Start Date *" type="date" error={formErrors.startDate} value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} />
          <Input label="Due Date *" type="date" error={formErrors.dueDate} value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} />
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
                <Avatar name={u.name} size="xs" />{u.name}
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

