import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { KEYS, asyncGet } from '../services/storage';
import { markNotificationRead, markAllRead as markAllReadService, deleteNotification } from '../services/notifications';
import { useAuth } from './AuthContext';
import api from '../services/api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!currentUser) { setNotifications([]); setUnreadCount(0); return; }
    const all = await asyncGet(KEYS.NOTIFICATIONS) || [];
    const userNotifs = all.filter(n => n.userId === currentUser.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    setNotifications(userNotifs);
    setUnreadCount(userNotifs.filter(n => !n.isRead).length);
  }, [currentUser]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, [refresh]);

  const markRead = useCallback(async (notifId) => {
    await markNotificationRead(notifId);
    refresh();
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    if (!currentUser) return;
    await markAllReadService(currentUser.id);
    refresh();
  }, [currentUser, refresh]);

  const deleteNotif = useCallback(async (notifId) => {
    await deleteNotification(notifId);
    refresh();
  }, [refresh]);

  const clearAll = useCallback(async () => {
    if (!currentUser) return;
    // Delete all of current user's notifications one by one
    const all = await asyncGet(KEYS.NOTIFICATIONS) || [];
    const userNotifs = all.filter(n => n.userId === currentUser.id);
    await Promise.all(userNotifs.map(n => deleteNotification(n.id)));
    refresh();
  }, [currentUser, refresh]);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, refresh, markRead, markAllRead, deleteNotif, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
}
