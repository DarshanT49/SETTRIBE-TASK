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
