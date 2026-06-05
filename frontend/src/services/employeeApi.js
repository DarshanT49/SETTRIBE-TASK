import api from './api';

/**
 * Fetch the full aggregated dashboard for one employee.
 * Calls: GET /api/employees/{id}/dashboard
 * Returns: { employee, kpis, timeline, projects }
 */
export const fetchEmployeeDashboard = (employeeId) =>
  api.get(`/employees/${employeeId}/dashboard`).then(r => r.data);

/**
 * Fetch a single user's profile.
 * Calls: GET /api/users/{id}
 */
export const fetchEmployeeById = (employeeId) =>
  api.get(`/users/${employeeId}`).then(r => r.data);

/**
 * Fetch lazy-loaded details for a specific project on the dashboard.
 * Calls: GET /api/employees/{employeeId}/projects/{projectId}/details
 */
export const fetchEmployeeProjectDetails = (employeeId, projectId) =>
  api.get(`/employees/${employeeId}/projects/${projectId}/details`).then(r => r.data);

