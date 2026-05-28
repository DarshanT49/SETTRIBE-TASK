import { KEYS, asyncGet } from './storage';
import { createNotification } from './notifications';

let reminderInterval = null;
const sentReminders = new Set();

export function startReminderEngine(currentUserId) {
  if (reminderInterval) clearInterval(reminderInterval);

  reminderInterval = setInterval(() => {
    checkTaskDeadlines(currentUserId);
    checkMeetingReminders(currentUserId);
    checkSelfTaskReminders(currentUserId);
  }, 60000); // Every 60 seconds

  // Run immediately
  checkTaskDeadlines(currentUserId);
  checkMeetingReminders(currentUserId);
  checkSelfTaskReminders(currentUserId);
}

export function stopReminderEngine() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
}

async function checkTaskDeadlines(userId) {
  const tasks = await asyncGet(KEYS.TASKS) || [];
  const now = new Date();
  const fiveMinLater = new Date(now.getTime() + 5 * 60000);

  tasks.forEach(task => {
    const assigneeIds = task.assigneeIds || [];
    if (!assigneeIds.includes(userId)) return;
    if (task.status === 'done') return;

    const dueDate = new Date(task.dueDate);
    const reminderKey = `task-5min-${task.id}`;

    // 5 min warning
    if (dueDate > now && dueDate <= fiveMinLater && !sentReminders.has(reminderKey)) {
      sentReminders.add(reminderKey);
      createNotification({
        userId,
        type: 'task_deadline_5min',
        title: '⏰ Task Due in 5 Minutes',
        message: `Task "${task.title}" is due in 5 minutes!`,
        relatedId: task.id,
        relatedType: 'task',
      });
      showBrowserNotification('Task Due Soon', `"${task.title}" is due in 5 minutes!`);
    }

    // Overdue check
    const overdueKey = `task-overdue-${task.id}-${Math.floor(now.getTime() / 1800000)}`;
    if (dueDate < now && !sentReminders.has(overdueKey)) {
      sentReminders.add(overdueKey);
      createNotification({
        userId,
        type: 'task_overdue',
        title: '🔴 Task Overdue',
        message: `Task "${task.title}" is overdue! Please submit a delay reason.`,
        relatedId: task.id,
        relatedType: 'task',
      });
    }
  });
}

async function checkMeetingReminders(userId) {
  const meetings = await asyncGet(KEYS.MEETINGS) || [];
  const now = new Date();

  meetings.forEach(meeting => {
    const participantIds = meeting.participantIds || [];
    if (!participantIds.includes(userId)) return;
    if (meeting.status === 'completed' || meeting.status === 'cancelled') return;

    const meetingTime = new Date(`${meeting.date}T${meeting.time}`);
    const diffMin = (meetingTime - now) / 60000;

    // 10 min reminder
    const key10 = `meeting-10min-${meeting.id}`;
    if (diffMin > 0 && diffMin <= 10 && !sentReminders.has(key10)) {
      sentReminders.add(key10);
      createNotification({
        userId,
        type: 'meeting_starting_soon',
        title: '📹 Meeting Starting in 10 Minutes',
        message: `"${meeting.title}" starts in 10 minutes. Click to join.`,
        relatedId: meeting.id,
        relatedType: 'meeting',
      });
      showBrowserNotification('Meeting Starting', `"${meeting.title}" starts in 10 minutes!`);
    }

    // 1 hr reminder
    const key1hr = `meeting-1hr-${meeting.id}`;
    if (diffMin > 55 && diffMin <= 65 && !sentReminders.has(key1hr)) {
      sentReminders.add(key1hr);
      createNotification({
        userId,
        type: 'meeting_starting_1hr',
        title: '📅 Meeting in 1 Hour',
        message: `"${meeting.title}" is scheduled in about 1 hour.`,
        relatedId: meeting.id,
        relatedType: 'meeting',
      });
    }
  });
}

async function checkSelfTaskReminders(userId) {
  const selfTasks = await asyncGet(KEYS.SELF_TASKS) || [];
  const now = new Date();

  selfTasks.filter(t => t.userId === userId && t.reminder && t.status !== 'done').forEach(task => {
    if (!task.date || !task.time) return;
    const taskTime = new Date(`${task.date}T${task.time}`);
    const offsetMs = getReminderOffsetMs(task.reminderOffset);
    const reminderTime = new Date(taskTime.getTime() - offsetMs);
    const key = `selftask-reminder-${task.id}`;
    const diff = Math.abs(now - reminderTime);

    if (diff < 60000 && !sentReminders.has(key)) {
      sentReminders.add(key);
      createNotification({
        userId,
        type: 'task_assigned',
        title: '📝 To-Do Reminder',
        message: `Reminder: "${task.title}" is coming up soon!`,
        relatedId: task.id,
        relatedType: 'self_task',
      });
      showBrowserNotification('To-Do Reminder', `"${task.title}" is coming up!`);
    }
  });
}

function getReminderOffsetMs(offset) {
  const map = { '5min': 5, '10min': 10, '30min': 30, '1hr': 60, '1day': 1440 };
  return (map[offset] || 10) * 60000;
}

function showBrowserNotification(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') new Notification(title, { body });
    });
  }
}
