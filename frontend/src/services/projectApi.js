import api from './api';

// --- Core Project CRUD ---
export const fetchProjects = async () => {
  const { data } = await api.get('/projects');
  return data;
};

export const fetchProjectById = async (projectId) => {
  const { data } = await api.get(`/projects/${projectId}`);
  return data;
};

export const createProject = async (projectData) => {
  const { data } = await api.post('/projects', projectData);
  return data;
};

export const updateProject = async (projectId, projectData) => {
  const { data } = await api.put(`/projects/${projectId}`, projectData);
  return data;
};

export const deleteProject = async (projectId) => {
  await api.delete(`/projects/${projectId}`);
};

// --- Project Members (Relational) ---
export const fetchProjectMembers = async (projectId) => {
  const { data } = await api.get(`/projects/${projectId}/members`);
  return data;
};

export const addProjectMember = async (projectId, userId, isLead = false) => {
  const { data } = await api.post(`/projects/${projectId}/members`, null, {
    params: { userId, isLead }
  });
  return data;
};

export const removeProjectMember = async (projectId, userId) => {
  await api.delete(`/projects/${projectId}/members/${userId}`);
};
