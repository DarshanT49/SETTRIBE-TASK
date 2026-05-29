import api from './api';

// Map frontend KEYS to backend API endpoint paths
const KEY_TO_ENDPOINT = {
  users: 'users',
  registrationRequests: 'registrationRequests',
  projects: 'projects',
  projectRequirements: 'projectRequirements',
  milestones: 'milestones',
  sprints: 'sprints',
  tasks: 'tasks',
  selfTasks: 'selfTasks',
  meetings: 'meetings',
  meetingRsvps: 'meetingRsvps',
  interviews: 'interviews',
  evaluations: 'evaluations',
  notifications: 'notifications',
  projectHistory: 'projectHistory',
  taskHistory: 'taskHistory',
};

// Keys that are local-only (not persisted to backend)
const isLocalOnly = (key) => ['theme', 'seeded', 'sessions'].includes(key);

export const asyncGet = async (key) => {
  if (isLocalOnly(key)) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  }
  const endpoint = KEY_TO_ENDPOINT[key] || key;
  try {
    const response = await api.get(`/${endpoint}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${key}:`, error);
    return [];
  }
};

/**
 * asyncSet — smart save to backend.
 *
 * When passed an ARRAY: diffs against what's currently in the backend.
 *   - New items (id not in backend) → POST
 *   - Changed items → PUT /{id}
 *   - Removed items → DELETE /{id}
 *
 * When passed a single OBJECT with an id: PUT if exists, POST if new.
 * When passed a single OBJECT without an id: POST.
 */
export const asyncSet = async (key, value) => {
  if (isLocalOnly(key)) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }

  const endpoint = KEY_TO_ENDPOINT[key] || key;

  try {
    if (Array.isArray(value)) {
      // Fetch the current state from backend
      let current = [];
      try {
        const res = await api.get(`/${endpoint}`);
        current = Array.isArray(res.data) ? res.data : [];
      } catch { current = []; }

      const currentMap = new Map(current.map(item => [item.id, item]));
      const updatedMap = new Map(value.map(item => [item.id, item]));

      // POST new items, PUT changed items
      for (const item of value) {
        if (!currentMap.has(item.id)) {
          await api.post(`/${endpoint}`, item);
        } else if (JSON.stringify(item) !== JSON.stringify(currentMap.get(item.id))) {
          await api.put(`/${endpoint}/${item.id}`, item);
        }
      }

      // DELETE removed items
      for (const item of current) {
        if (!updatedMap.has(item.id)) {
          await api.delete(`/${endpoint}/${item.id}`);
        }
      }

      return value;
    }

    // Single object
    if (value && value.id) {
      try {
        await api.get(`/${endpoint}/${value.id}`);
        // exists → PUT
        await api.put(`/${endpoint}/${value.id}`, value);
      } catch {
        // not found → POST
        await api.post(`/${endpoint}`, value);
      }
    } else {
      await api.post(`/${endpoint}`, value);
    }
    return value;
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
    return value;
  }
};

export const asyncUpdate = async (key, updater) => {
  if (isLocalOnly(key)) {
    const current = localStorage.getItem(key);
    const parsed = current ? JSON.parse(current) : null;
    const updated = updater(parsed);
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  }

  const endpoint = KEY_TO_ENDPOINT[key] || key;
  try {
    const { data: current } = await api.get(`/${endpoint}`);
    const updated = updater(current);
    await asyncSet(key, updated);
    return updated;
  } catch (error) {
    console.error(`Error updating ${key}:`, error);
    return null;
  }
};

export const asyncDeleteById = async (key, id) => {
  const endpoint = KEY_TO_ENDPOINT[key] || key;
  try {
    await api.delete(`/${endpoint}/${id}`);
  } catch (error) {
    console.error(`Error deleting ${key}/${id}:`, error);
  }
};

export const asyncDelete = async (key) => {
  if (isLocalOnly(key)) {
    localStorage.removeItem(key);
    return;
  }
  const endpoint = KEY_TO_ENDPOINT[key] || key;
  try {
    await api.delete(`/${endpoint}`);
  } catch (error) {
    console.error(`Error deleting ${key}:`, error);
  }
};

// Sync helpers - memory cache for immediate UI calls
const memoryCache = {};

export const syncGet = (key) => {
  if (isLocalOnly(key)) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch {
      return null;
    }
  }
  return memoryCache[key] || [];
};

export const syncSet = (key, value) => {
  if (isLocalOnly(key)) {
    localStorage.setItem(key, JSON.stringify(value));
    return value;
  }
  memoryCache[key] = value;
  asyncSet(key, value);
  return value;
};

// Direct API helpers for single item operations (faster, no diff needed)
export const apiPost = async (key, item) => {
  const endpoint = KEY_TO_ENDPOINT[key] || key;
  try {
    const res = await api.post(`/${endpoint}`, item);
    return res.data;
  } catch (e) {
    console.error(`Error posting to ${key}:`, e);
    throw e;
  }
};

export const apiPut = async (key, id, item) => {
  const endpoint = KEY_TO_ENDPOINT[key] || key;
  try {
    const res = await api.put(`/${endpoint}/${id}`, item);
    return res.data;
  } catch (e) {
    console.error(`Error putting to ${key}/${id}:`, e);
    throw e;
  }
};

export const apiDelete = async (key, id) => {
  const endpoint = KEY_TO_ENDPOINT[key] || key;
  try {
    await api.delete(`/${endpoint}/${id}`);
  } catch (e) {
    console.error(`Error deleting ${key}/${id}:`, e);
    throw e;
  }
};

export const KEYS = {
  USERS: 'users',
  REGISTRATION_REQUESTS: 'registrationRequests',
  SESSIONS: 'sessions',
  PROJECTS: 'projects',
  PROJECT_REQUIREMENTS: 'projectRequirements',
  MILESTONES: 'milestones',
  SPRINTS: 'sprints',
  TASKS: 'tasks',
  SELF_TASKS: 'selfTasks',
  MEETINGS: 'meetings',
  MEETING_RSVPS: 'meetingRsvps',
  INTERVIEWS: 'interviews',
  EVALUATIONS: 'evaluations',
  NOTIFICATIONS: 'notifications',
  PROJECT_HISTORY: 'projectHistory',
  TASK_HISTORY: 'taskHistory',
  SEEDED: 'seeded',
  THEME: 'theme',
};
