import { v4 as uuidv4 } from 'uuid';
import api from './api';

export async function createNotification({ userId, type, title, message, relatedId, relatedType }) {
  const notification = {
    id: uuidv4(),
    userId,
    type,
    title,
    message,
    isRead: false,
    createdAt: new Date().toISOString(),
    relatedId: relatedId || null,
    relatedType: relatedType || null,
  };
  try {
    await api.post('/notifications', notification);
  } catch (e) {
    console.error('createNotification error:', e);
  }
  return notification;
}

export function createBulkNotifications(userIds, data) {
  userIds.forEach(userId => createNotification({ userId, ...data }));
}

export async function markNotificationRead(notificationId) {
  try {
    const resp = await api.get(`/notifications/${notificationId}`);
    const notif = resp.data;
    if (notif) {
      await api.put(`/notifications/${notificationId}`, { ...notif, isRead: true });
    }
  } catch (e) {
    console.error('markNotificationRead error:', e);
  }
}

export async function markAllRead(userId) {
  try {
    const { data: notifications } = await api.get(`/notifications?userId=${userId}`);
    const unread = notifications.filter(n => !n.isRead);
    await Promise.all(unread.map(n =>
      api.put(`/notifications/${n.id}`, { ...n, isRead: true })
    ));
  } catch (e) {
    console.error('markAllRead error:', e);
  }
}

export async function getUnreadCount(userId) {
  try {
    const { data: notifications } = await api.get(`/notifications?userId=${userId}`);
    return notifications.filter(n => !n.isRead).length;
  } catch (e) {
    console.error('getUnreadCount error:', e);
    return 0;
  }
}

export async function getUserNotifications(userId) {
  try {
    const { data: notifications } = await api.get(`/notifications?userId=${userId}`);
    return notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (e) {
    console.error('getUserNotifications error:', e);
    return [];
  }
}

export async function deleteNotification(notificationId) {
  try {
    await api.delete(`/notifications/${notificationId}`);
  } catch (e) {
    console.error('deleteNotification error:', e);
  }
}

// Notify all admin and hr users
export async function notifyAdminsAndHR(data) {
  try {
    const { data: users } = await api.get('/users');
    const adminHR = users.filter(u => ['admin', 'hr'].includes(u.role) && u.isActive);
    adminHR.forEach(u => createNotification({ userId: u.id, ...data }));
  } catch (e) {
    console.error('notifyAdminsAndHR error:', e);
  }
}
