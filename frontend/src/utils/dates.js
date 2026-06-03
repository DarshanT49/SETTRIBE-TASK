import { formatDistanceToNow, parseISO, addDays } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

const IST = 'Asia/Kolkata';

export function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  try {
    return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function formatDate(dateStr, fmt = 'dd MMM yyyy') {
  if (!dateStr) return '';
  try {
    return formatInTimeZone(parseISO(dateStr), IST, fmt);
  } catch {
    try {
      return formatInTimeZone(new Date(dateStr), IST, fmt);
    } catch {
      return dateStr;
    }
  }
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = parseISO(dateStr);
    const dateOnly = formatInTimeZone(d, IST, 'yyyy-MM-dd');
    const today = formatInTimeZone(new Date(), IST, 'yyyy-MM-dd');
    const yesterday = formatInTimeZone(new Date(Date.now() - 86400000), IST, 'yyyy-MM-dd');

    if (dateOnly === today) return `Today, ${formatInTimeZone(d, IST, 'hh:mm a')}`;
    if (dateOnly === yesterday) return `Yesterday, ${formatInTimeZone(d, IST, 'hh:mm a')}`;
    return formatInTimeZone(d, IST, 'dd MMM yyyy, hh:mm a');
  } catch {
    return dateStr;
  }
}

export function groupByDate(items, dateKey = 'createdAt') {
  const groups = { today: [], yesterday: [], thisWeek: [], older: [] };
  const now = new Date();
  const todayStr = formatInTimeZone(now, IST, 'yyyy-MM-dd');
  const yesterdayStr = formatInTimeZone(new Date(Date.now() - 86400000), IST, 'yyyy-MM-dd');
  const oneWeekAgo = new Date(now - 7 * 86400000);

  items.forEach(item => {
    try {
      const d = new Date(item[dateKey]);
      const dStr = formatInTimeZone(d, IST, 'yyyy-MM-dd');
      
      if (dStr === todayStr) groups.today.push(item);
      else if (dStr === yesterdayStr) groups.yesterday.push(item);
      else if (d >= oneWeekAgo) groups.thisWeek.push(item);
      else groups.older.push(item);
    } catch {
      groups.older.push(item);
    }
  });

  return groups;
}

export function isOverdue(dueDateStr) {
  if (!dueDateStr) return false;
  return new Date(dueDateStr) < new Date();
}

export function rescheduleMilestones(milestones, fromMilestoneId, delayDays) {
  let found = false;
  return milestones.map(ms => {
    if (ms.id === fromMilestoneId) { found = true; return ms; }
    if (found && ms.status === 'upcoming') {
      const newDate = addDays(new Date(ms.targetDate), delayDays);
      return { ...ms, targetDate: newDate.toISOString() };
    }
    return ms;
  });
}

export function getMeetingDateTime(meeting) {
  // Assume the meeting time in the database was intended for IST
  // Append +05:30 so it parses to the exact UTC equivalent
  return new Date(`${meeting.date}T${meeting.time}:00+05:30`);
}

export function canStartMeeting(meeting) {
  const meetingTime = getMeetingDateTime(meeting);
  const now = new Date();
  const diff = meetingTime - now;
  return diff <= 15 * 60000 && diff > -2 * 3600000; // 15 min before to 2 hrs after
}

// Derives the effective meeting status from current time, overriding stale stored values.
export function getMeetingStatus(m) {
  // Honour explicit terminal states stored in DB
  if (m.status === 'cancelled') return 'cancelled';
  if (m.status === 'completed' || m.endedByHost) return 'completed';
  const start = getMeetingDateTime(m);
  const end = new Date(start.getTime() + (parseInt(m.duration) || 60) * 60000);
  const now = new Date();
  if (now >= end) return 'completed';
  if (now >= start) return 'ongoing';
  return 'upcoming';
}

export function formatDuration(minutes) {
  const m = parseInt(minutes);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}h ${rem}m` : `${h}h`;
}

export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
}

export function getAvatarColor(id) {
  const colors = [
    'bg-violet-600', 'bg-blue-600', 'bg-emerald-600', 'bg-rose-600',
    'bg-amber-600', 'bg-cyan-600', 'bg-fuchsia-600', 'bg-indigo-600',
  ];
  if (!id) return colors[0];
  const sum = id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return colors[sum % colors.length];
}

