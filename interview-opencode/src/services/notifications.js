import { KEYS, asyncGet } from './storage';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const api = axios.create({
  baseURL: `http://${window.location.hostname}:8080/api`
});

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
    const notifications = await asyncGet(KEYS.NOTIFICATIONS) || [];
    const unread = notifications.filter(n => n.userId === userId && !n.isRead);
    await Promise.all(unread.map(n =>
      api.put(`/notifications/${n.id}`, { ...n, isRead: true })
    ));
  } catch (e) {
    console.error('markAllRead error:', e);
  }
}

export async function getUnreadCount(userId) {
  const notifications = await asyncGet(KEYS.NOTIFICATIONS) || [];
  return notifications.filter(n => n.userId === userId && !n.isRead).length;
}

export async function getUserNotifications(userId) {
  const notifications = await asyncGet(KEYS.NOTIFICATIONS) || [];
  return notifications.filter(n => n.userId === userId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
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
    const users = await asyncGet(KEYS.USERS) || [];
    const adminHR = users.filter(u => ['admin', 'hr'].includes(u.role) && u.isActive);
    adminHR.forEach(u => createNotification({ userId: u.id, ...data }));
  } catch (e) {
    console.error('notifyAdminsAndHR error:', e);
  }
}
