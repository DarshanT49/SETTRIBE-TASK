import api from './api';

export async function saveStandupRecord(record) {
  const { data } = await api.post('/standup', record);
  return data;
}

export async function getStandupData() {
  const { data } = await api.get('/standup');
  return data;
}

export async function filterStandupData(filters) {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.meetingType) params.append('meetingType', filters.meetingType);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.status) params.append('status', filters.status);
  
  const { data } = await api.get(`/standup/filter?${params.toString()}`);
  return data;
}

export function exportStandupData(filters) {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.meetingType) params.append('meetingType', filters.meetingType);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.status) params.append('status', filters.status);
  
  // Use window.open or link click to trigger download
  const url = `${api.defaults.baseURL}/standup/export?${params.toString()}`;
  window.open(url, '_blank');
}
