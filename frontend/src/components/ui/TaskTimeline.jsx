import { FolderKanban, Clock, CheckCircle2, FileText, Users, Calendar } from 'lucide-react';
import { StatusBadge } from './index';

function getWeekLabel(date) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Start of current week (Sunday)
  const currentWeekStart = new Date(today);
  currentWeekStart.setDate(today.getDate() - today.getDay());
  
  const eventDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const eventWeekStart = new Date(eventDate);
  eventWeekStart.setDate(eventDate.getDate() - eventDate.getDay());
  
  const diffTime = currentWeekStart.getTime() - eventWeekStart.getTime();
  const diffWeeks = Math.round(diffTime / (1000 * 60 * 60 * 24 * 7));
  
  if (diffWeeks === 0) return 'This Week';
  if (diffWeeks === 1) return 'Last Week';
  if (diffWeeks === 2) return '2 Weeks Ago';
  if (diffWeeks === 3) return '3 Weeks Ago';
  
  return `Week of ${eventWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

/**
 * Renders a chronological vertical timeline of all employee activity events, grouped by week.
 * Event types: TASK_STATUS_CHANGE | WORKLOG | STANDUP
 *
 * @param {Object[]} events   - Array of TaskTimelineItemDTO from the API
 * @param {Function} onProjectClick - Called with projectId when a project link is clicked
 */
export function TaskTimeline({ events = [], onProjectClick }) {
  if (!events.length) {
    return (
      <div className="py-12 text-center text-gray-500">
        <Clock size={32} className="mx-auto mb-3 opacity-40" />
        <p className="text-sm">No activity recorded yet.</p>
      </div>
    );
  }

  // Group events by week
  const groupedEvents = events.reduce((acc, event) => {
    const dateStr = (event.occurredAt || '').replace(' ', 'T');
    const d = new Date(dateStr);
    
    let label = 'Unknown Date';
    if (!isNaN(d.getTime())) {
      label = getWeekLabel(d);
    }
    
    if (!acc[label]) acc[label] = [];
    acc[label].push(event);
    return acc;
  }, {});

  return (
    <div className="relative pt-2">
      {/* Vertical spine */}
      <div className="absolute left-[19px] top-6 bottom-2 w-0.5 bg-gradient-to-b from-primary-700/60 via-gray-700/40 to-transparent rounded-full" />

      <div className="space-y-6">
        {Object.entries(groupedEvents).map(([weekLabel, weekEvents]) => (
          <div key={weekLabel}>
            <div className="flex items-center gap-3 mb-4 relative z-10 pl-1">
              <div className="w-9 h-9 bg-gray-900 border border-gray-700/60 rounded-full flex items-center justify-center shadow-sm shrink-0">
                <Calendar size={14} className="text-primary-400" />
              </div>
              <h4 className="text-sm font-semibold text-gray-200">{weekLabel}</h4>
            </div>
            
            <div className="space-y-1">
              {weekEvents.map((event, idx) => (
                <TimelineEvent key={`${weekLabel}-${idx}`} event={event} onProjectClick={onProjectClick} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TimelineEvent({ event, onProjectClick }) {
  const { dotColor, icon: Icon, bgColor } = getEventStyle(event);
  const timeLabel = formatTimeLabel(event.occurredAt);

  return (
    <div className="relative flex gap-4 pb-4 pl-10 group">
      {/* Timeline dot */}
      <div className={`absolute left-3 top-1 w-4 h-4 rounded-full border-2 border-gray-900 flex items-center justify-center flex-shrink-0 ${dotColor} transition-transform group-hover:scale-110`}>
        <Icon size={8} className="text-white" />
      </div>

      {/* Event card */}
      <div className={`flex-1 rounded-xl p-3 border transition-all duration-200 group-hover:border-gray-600/60 ${bgColor}`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-200 leading-snug">{event.title}</p>

            {/* Status badge for task events */}
            {event.eventType === 'TASK_STATUS_CHANGE' && event.toStatus && (
              <div className="flex items-center gap-2 mt-1.5">
                {event.fromStatus && (
                  <>
                    <StatusBadge status={event.fromStatus} />
                    <span className="text-gray-600 text-xs">→</span>
                  </>
                )}
                <StatusBadge status={event.toStatus} />
              </div>
            )}

            {/* Worklog hours badge */}
            {event.eventType === 'WORKLOG' && event.loggedHours != null && (
              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-blue-900/30 border border-blue-800/40 text-blue-400 text-xs font-mono">
                <Clock size={10} /> {event.loggedHours}h logged
              </span>
            )}

            {/* Standup meeting type */}
            {event.eventType === 'STANDUP' && event.meetingType && (
              <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full bg-purple-900/30 border border-purple-800/40 text-purple-400 text-xs capitalize">
                <Users size={10} /> {event.meetingType}
              </span>
            )}
          </div>

          <span className="text-xs text-gray-500 whitespace-nowrap flex-shrink-0 pt-0.5">{timeLabel}</span>
        </div>

        {/* Project drill-down link */}
        {event.projectId && (
          <button
            id={`timeline-project-${event.projectId}-${Math.random().toString(36).slice(2, 6)}`}
            onClick={() => onProjectClick && onProjectClick(event.projectId)}
            className="mt-2 flex items-center gap-1.5 text-xs text-primary-400 hover:text-primary-300 transition-colors group/link"
          >
            <FolderKanban size={11} className="flex-shrink-0" />
            <span className="truncate group-hover/link:underline">{event.projectTitle || `Project #${event.projectId}`}</span>
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getEventStyle(event) {
  switch (event.eventType) {
    case 'TASK_STATUS_CHANGE':
      if (event.toStatus === 'done') {
        return { dotColor: 'bg-emerald-500', icon: CheckCircle2, bgColor: 'bg-emerald-900/10 border-emerald-800/30' };
      }
      if (event.toStatus === 'in_progress') {
        return { dotColor: 'bg-blue-500', icon: Clock, bgColor: 'bg-blue-900/10 border-blue-800/30' };
      }
      return { dotColor: 'bg-gray-600', icon: Clock, bgColor: 'bg-gray-800/40 border-gray-700/30' };
    case 'WORKLOG':
      return { dotColor: 'bg-indigo-500', icon: FileText, bgColor: 'bg-indigo-900/10 border-indigo-800/30' };
    case 'STANDUP':
      return { dotColor: 'bg-purple-500', icon: Users, bgColor: 'bg-purple-900/10 border-purple-800/30' };
    default:
      return { dotColor: 'bg-gray-600', icon: Clock, bgColor: 'bg-gray-800/40 border-gray-700/30' };
  }
}

function formatTimeLabel(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return isoString;
  }
}
