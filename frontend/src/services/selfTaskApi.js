import api from './api';

export const fetchSelfTasks = async () => {
  const { data } = await api.get('/selfTasks');
  return data;
};

export const fetchSelfTasksByUserId = async (userId) => {
  const { data } = await api.get(`/selfTasks/user/${userId}`);
  return data;
};

export const fetchSelfTaskById = async (taskId) => {
  const { data } = await api.get(`/selfTasks/${taskId}`);
  return data;
};

export const createSelfTask = async (taskData) => {
  const { data } = await api.post('/selfTasks', taskData);
  return data;
};

export const updateSelfTask = async (taskId, taskData) => {
  const { data } = await api.put(`/selfTasks/${taskId}`, taskData);
  return data;
};

export const deleteSelfTask = async (taskId) => {
  await api.delete(`/selfTasks/${taskId}`);
};
