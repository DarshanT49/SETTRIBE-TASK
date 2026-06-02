import api from './api';

export async function getMeetingJoinToken(meetingId, user) {
  const { data } = await api.post(`/meetings/${meetingId}/join-token`, {
    userId: user.id,
    displayName: user.name
  });
  return data;
}

export async function markMeetingJoined(meetingId, userId) {
  try {
    await api.post(`/meetings/${meetingId}/attendance/join`, { userId });
  } catch (error) {
    console.warn('Unable to record meeting join:', error);
  }
}

export async function markMeetingLeft(meetingId, userId) {
  try {
    await api.post(`/meetings/${meetingId}/attendance/leave`, { userId });
  } catch (error) {
    console.warn('Unable to record meeting leave:', error);
  }
}

export async function markMeetingAbsent(meetingId, userId) {
  try {
    await api.post(`/meetings/${meetingId}/attendance/absent`, { userId });
  } catch (error) {
    console.warn('Unable to record meeting absent:', error);
  }
}

export async function saveStandupRecords(meetingId, records) {
  const { data } = await api.post(`/meetings/${meetingId}/standups`, records);
  return data;
}

export async function getStandupRecords(meetingId) {
  const { data } = await api.get(`/meetings/${meetingId}/standups`);
  return data;
}
