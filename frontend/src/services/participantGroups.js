import api from './api';

export const getGroups = async (userId) => {
  const { data } = await api.get('/groups', {
    headers: { userId }
  });
  return data;
};

export const createGroup = async (userId, groupData) => {
  const { data } = await api.post('/groups', groupData, {
    headers: { userId }
  });
  return data;
};

export const updateGroup = async (userId, id, groupData) => {
  const { data } = await api.put(`/groups/${id}`, groupData, {
    headers: { userId }
  });
  return data;
};

export const deleteGroup = async (userId, id) => {
  await api.delete(`/groups/${id}`, {
    headers: { userId }
  });
};

export const shareGroup = async (userId, id, userIdsToShareWith) => {
  const { data } = await api.post(`/groups/${id}/share`, userIdsToShareWith, {
    headers: { userId }
  });
  return data;
};
