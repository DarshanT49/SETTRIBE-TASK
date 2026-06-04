 
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { markNotificationRead, markAllRead as markAllReadService, deleteNotification, getUserNotifications, getUnreadCount as getUnreadCountService } from '../services/notifications';
import { useAuth } from './AuthContext';
   
import api from '../services/api';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const prevNotifsRef = useRef(new Set());

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!currentUser) { setNotifications([]); setUnreadCount(0); return; }
    const userNotifs = await getUserNotifications(currentUser.id);
    
    if ('Notification' in window && Notification.permission === 'granted') {
      if (prevNotifsRef.current.size > 0) {
        userNotifs.forEach(notif => {
          if (!notif.isRead && !prevNotifsRef.current.has(notif.id) && document.hidden) {
            new Notification(notif.title, { body: notif.message });
          }
        });
      }
    }
    prevNotifsRef.current = new Set(userNotifs.map(n => n.id));

    setNotifications(userNotifs);
    setUnreadCount(await getUnreadCountService(currentUser.id));
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
    const userNotifs = await getUserNotifications(currentUser.id);
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
