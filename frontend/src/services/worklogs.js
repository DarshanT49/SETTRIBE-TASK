import api from './api';

export const worklogService = {
  logTime: async (worklogData) => {
    try {
      const response = await api.post('/worklogs', worklogData);
      return response.data;
    } catch (error) {
      console.error('Error logging time:', error);
      throw error;
    }
  },
  
  getUserWorklogs: async (userId) => {
    try {
      const response = await api.get(`/worklogs/user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching worklogs:', error);
      throw error;
    }
  },
  
  getUserAnalytics: async (userId) => {
    try {
      const response = await api.get(`/worklogs/analytics/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching analytics:', error);
      throw error;
    }
  }
};
