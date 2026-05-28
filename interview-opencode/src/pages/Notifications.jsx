
import { useNavigate } from 'react-router-dom';
import { Bell, Check, CheckCheck, Trash, ArrowRight } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { Button } from '../components/ui';
import { formatRelativeTime } from '../utils/dates';

const notifTypeIcons = {
  task_assigned: '📋', task_overdue: '🔴', task_deadline_5min: '⏰',
  meeting_invited: '📹', meeting_starting_soon: '🔔', interview_scheduled: '🎙️',
  project_added: '🚀', milestone_completed: '✅', registration_request: '👤',
  registration_approved: '✅', registration_rejected: '❌', default: '🔔',
};

const relatedRoutes = { task: '/tasks', meeting: '/meetings', interview: '/interviews', project: '/projects', user: '/employees' };

export default function Notifications() {
  const { notifications, markRead, markAllRead, clearAll } = useNotifications();
  const navigate = useNavigate();

  const handleClick = (n) => {
    markRead(n.id);
    if (n.relatedId && n.relatedType && relatedRoutes[n.relatedType]) {
      navigate(`${relatedRoutes[n.relatedType]}/${n.relatedId}`);
    }
  };

  const groups = {};
  notifications.forEach(n => {
    const date = new Date(n.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(n);
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2"><Bell size={24} />Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">{notifications.filter(n => !n.isRead).length} unread</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={markAllRead}><CheckCheck size={14} />Mark All Read</Button>
          <Button variant="ghost" size="sm" onClick={clearAll}><Trash size={14} />Clear All</Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell size={40} className="text-gray-600 mx-auto mb-3" />
          <h2 className="font-semibold text-gray-400">All caught up!</h2>
          <p className="text-sm text-gray-600 mt-1">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([date, notifs]) => (
            <div key={date}>
              <h2 className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-3">{date}</h2>
              <div className="card overflow-hidden divide-y divide-gray-800">
                {notifs.map(n => (
                  <button key={n.id} onClick={() => handleClick(n)}
                    className={`w-full flex gap-4 px-4 py-4 hover:bg-gray-800/50 transition-colors text-left ${!n.isRead ? 'bg-gray-800/30' : ''}`}>
                    <span className="text-2xl flex-shrink-0">{notifTypeIcons[n.type] || notifTypeIcons.default}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${n.isRead ? 'text-gray-400' : 'text-gray-100'}`}>{n.title}</p>
                        <span className="text-xs text-gray-600 flex-shrink-0">{formatRelativeTime(n.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                    {!n.isRead && <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
