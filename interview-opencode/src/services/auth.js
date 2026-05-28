import { KEYS } from './storage';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

const api = axios.create({
  baseURL: `http://${window.location.hostname}:8080/api`
});

export async function login(emailOrId, password) {
  try {
    // Try login with email first
    const response = await api.post('/sessions/login', { email: emailOrId, password });
    const { token, currentUserId, user } = response.data;
    // Store session locally
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify({ currentUserId, token }));
    return { success: true, user };
  } catch (err) {
    if (err.response?.status === 401) {
      // Check for pending_approval or deactivated
      // Try fetching user to determine status
      try {
        const usersResp = await api.get('/users');
        const users = usersResp.data || [];
        const user = users.find(
          u => (u.email === emailOrId || u.employeeId === emailOrId) && u.password === password
        );
        if (!user) return { success: false, error: 'Invalid credentials' };
        if (!user.isApproved) return { success: false, error: 'pending_approval', userId: user.id };
        if (!user.isActive) return { success: false, error: 'Account is deactivated. Please contact admin.' };
      } catch {
        // ignore
      }
      return { success: false, error: 'Invalid credentials' };
    }
    console.error('Login error:', err);
    return { success: false, error: 'Server error. Please try again.' };
  }
}

export function logout() {
  localStorage.removeItem(KEYS.SESSIONS);
}

export async function getCurrentUser() {
  const sessionStr = localStorage.getItem(KEYS.SESSIONS);
  if (!sessionStr) return null;
  let session;
  try { session = JSON.parse(sessionStr); } catch { return null; }
  if (!session?.currentUserId) return null;

  try {
    const response = await api.get(`/users/${session.currentUserId}`);
    return response.data;
  } catch {
    return null;
  }
}

export function getSessionSync() {
  const sessionStr = localStorage.getItem(KEYS.SESSIONS);
  if (!sessionStr) return null;
  try { return JSON.parse(sessionStr); } catch { return null; }
}

export async function getSession() {
  return getSessionSync();
}

export async function updateUserProfile(userId, updates) {
  try {
    const response = await api.get(`/users/${userId}`);
    const user = response.data;
    if (!user) return null;
    const updated = { ...user, ...updates };
    const updateResp = await api.put(`/users/${userId}`, updated);
    return updateResp.data;
  } catch (e) {
    console.error('updateUserProfile error:', e);
    return null;
  }
}

export async function changePassword(userId, currentPassword, newPassword) {
  try {
    const response = await api.get(`/users/${userId}`);
    const user = response.data;
    if (!user) return { success: false, error: 'User not found' };
    if (user.password !== currentPassword) return { success: false, error: 'Current password is incorrect' };
    await updateUserProfile(userId, { password: newPassword });
    return { success: true };
  } catch (e) {
    console.error('changePassword error:', e);
    return { success: false, error: 'Server error' };
  }
}

export async function registerUser(data) {
  try {
    // Check for duplicate email or employeeId
    const usersResp = await api.get('/users');
    const users = usersResp.data || [];
    if (users.find(u => u.email === data.email)) return { success: false, error: 'Email already registered' };
    if (users.find(u => u.employeeId === data.employeeId)) return { success: false, error: 'Employee ID already taken' };

    const newUser = {
      id: uuidv4(),
      name: data.name,
      employeeId: data.employeeId,
      email: data.email,
      mobile: data.mobile,
      department: data.department,
      role: data.role,
      isActive: false,
      isApproved: false,
      approvedBy: null,
      approvedAt: null,
      createdAt: new Date().toISOString(),
      profilePhoto: null,
      password: data.password,
    };

    const userResp = await api.post('/users', newUser);
    const savedUser = userResp.data;

    // Create registration request
    const regRequest = {
      id: uuidv4(),
      userId: savedUser.id,
      status: 'pending',
      requestedAt: new Date().toISOString(),
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: '',
    };
    await api.post('/registrationRequests', regRequest);

    return { success: true, user: savedUser };
  } catch (e) {
    console.error('registerUser error:', e);
    return { success: false, error: 'Registration failed. Please try again.' };
  }
}

export function hasPermission(user, action, context = {}) {
  if (!user) return false;
  const role = user.role;

  const permissions = {
    approve_registration: ['admin', 'hr'],
    add_employee: ['admin'],
    view_employee_directory: ['admin', 'hr', 'manager', 'panel'],
    create_project: ['admin', 'manager', 'employee'],
    assign_project_owner: ['admin', 'manager'],
    add_team_members: ['admin', 'manager'],
    manage_milestones: ['admin', 'manager'],
    create_task: ['admin', 'manager'],
    assign_task: ['admin', 'manager'],
    approve_task: ['admin', 'manager'],
    schedule_meeting: ['admin', 'hr', 'manager', 'employee', 'intern', 'panel'],
    host_meeting: ['admin', 'hr', 'manager', 'employee'],
    schedule_interview: ['admin', 'hr'],
    evaluate_candidate: ['admin', 'manager', 'employee', 'panel'],
    view_reports: ['admin', 'hr', 'manager', 'employee'],
    view_all_reports: ['admin'],
  };

  // Context-based overrides
  if (action === 'create_task' && context.isProjectOwner) return true;
  if (action === 'assign_task' && (context.isProjectOwner || context.hasDelegatedRights)) return true;
  if (action === 'manage_milestones' && context.isProjectOwner) return true;
  if (action === 'approve_task' && (context.isProjectOwner || context.isTeamLead)) return true;
  if (action === 'evaluate_candidate' && context.isAssignedInterviewer) return true;

  return permissions[action]?.includes(role) || role === 'admin';
}
