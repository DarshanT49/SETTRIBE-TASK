import api from './api';

// --- Core Task CRUD ---
export const fetchTasks = async () => {
  const { data } = await api.get('/tasks');
  return data;
};

export const fetchTaskById = async (taskId) => {
  const { data } = await api.get(`/tasks/${taskId}`);
  return data;
};

export const createTask = async (taskData) => {
  const { data } = await api.post('/tasks', taskData);
  return data;
};

export const updateTask = async (taskId, taskData) => {
  const { data } = await api.put(`/tasks/${taskId}`, taskData);
  return data;
};

export const deleteTask = async (taskId) => {
  await api.delete(`/tasks/${taskId}`);
};

// --- Task Assignees (Relational) ---
export const fetchTaskAssignees = async (taskId) => {
  const { data } = await api.get(`/tasks/${taskId}/assignees`);
  return data;
};

export const addTaskAssignee = async (taskId, userId) => {
  const { data } = await api.post(`/tasks/${taskId}/assignees`, null, {
    params: { userId }
  });
  return data;
};

export const removeTaskAssignee = async (taskId, userId) => {
  await api.delete(`/tasks/${taskId}/assignees/${userId}`);
};

export const fetchTaskHistory = async (taskId) => {
  const { data } = await api.get(`/tasks/${taskId}/history`);
  return data;
};
