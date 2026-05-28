import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bell, Sun, Moon, Menu, LogOut, User, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Avatar } from '../ui';
import { formatRelativeTime } from '../../utils/dates';

const notifTypeIcons = {
  task_assigned: '📋', task_overdue: '🔴', task_deadline_5min: '⏰',
  meeting_invited: '📹', meeting_starting_soon: '🔔', interview_scheduled: '🎙️',
  project_added: '🚀', milestone_completed: '✅', registration_request: '👤',
  registration_approved: '✅', registration_rejected: '❌', default: '🔔',
};

export function Topbar({ onMobileMenu }) {
  const { currentUser, logout } = useAuth();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const notifsRef = useRef(null);
  const userRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUser(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleNotifClick = (notif) => {
    markRead(notif.id);
    setShowNotifs(false);
    const routes = { task: '/tasks', meeting: '/meetings', interview: '/interviews', project: '/projects', milestone: '/projects' };
    if (notif.relatedType && routes[notif.relatedType]) navigate(routes[notif.relatedType]);
  };

  return (
    <header className="h-16 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-4 gap-4 sticky top-0 z-30">
      {/* Left: hamburger for mobile */}
      <button onClick={onMobileMenu} className="lg:hidden text-gray-400 hover:text-gray-100 p-1">
        <Menu size={20} />
      </button>
      <div className="flex-1" />

      {/* Right controls */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
          title={theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifsRef}>
          <button
            onClick={() => { setShowNotifs(!showNotifs); setShowUser(false); }}
            className="relative p-2 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-12 w-80 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
                <h3 className="font-semibold text-gray-100 text-sm">Notifications</h3>
                <button onClick={markAllRead} className="text-xs text-primary-400 hover:text-primary-300">Mark all read</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.slice(0, 10).length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-sm">No notifications</div>
                ) : notifications.slice(0, 10).map(n => (
                  <button
                    key={n.id}
                    onClick={() => handleNotifClick(n)}
                    className={`w-full flex gap-3 px-4 py-3 hover:bg-gray-800 transition-colors text-left ${!n.isRead ? 'bg-gray-800/50' : ''}`}
                  >
                    <span className="text-base flex-shrink-0 mt-0.5">
                      {notifTypeIcons[n.type] || notifTypeIcons.default}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${n.isRead ? 'text-gray-400' : 'text-gray-100 font-medium'} truncate`}>{n.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-600 mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-1.5" />}
                  </button>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-gray-800">
                <Link to="/notifications" onClick={() => setShowNotifs(false)} className="text-xs text-primary-400 hover:text-primary-300">
                  View all notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setShowUser(!showUser); setShowNotifs(false); }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Avatar name={currentUser?.name} photo={currentUser?.profilePhoto} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-200 leading-none">{currentUser?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{currentUser?.role}</p>
            </div>
            <ChevronDown size={14} className="text-gray-500 hidden sm:block" />
          </button>

          {showUser && (
            <div className="absolute right-0 top-12 w-48 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-50 animate-fade-in overflow-hidden">
              <Link to="/profile" onClick={() => setShowUser(false)} className="flex items-center gap-2 px-4 py-3 hover:bg-gray-800 text-sm text-gray-300 hover:text-gray-100 transition-colors">
                <User size={14} /> Profile & Settings
              </Link>
              <hr className="border-gray-800" />
              <button onClick={logout} className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-800 text-sm text-red-400 hover:text-red-300 transition-colors">
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
