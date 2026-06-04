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
  if (filters.hostId) params.append('hostId', filters.hostId);
  
  const { data } = await api.get(`/standup/filter?${params.toString()}`);
  return data;
}

export async function exportStandupData(filters) {
  const params = new URLSearchParams();
  if (filters.startDate) params.append('startDate', filters.startDate);
  if (filters.endDate) params.append('endDate', filters.endDate);
  if (filters.meetingType) params.append('meetingType', filters.meetingType);
  if (filters.userId) params.append('userId', filters.userId);
  if (filters.status) params.append('status', filters.status);
  if (filters.hostId) params.append('hostId', filters.hostId);
  
  try {
    const response = await api.get(`/standup/export?${params.toString()}`, {
      responseType: 'blob'
    });
    
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'standup-report.xlsx');
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Export failed", error);
  }
}
