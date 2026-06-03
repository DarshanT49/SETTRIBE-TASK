import axios from 'axios';

// ─────────────────────────────────────────────────────────────────────────────
// API Base URL Resolution
//
// LOCAL DEV  → VITE_API_BASE_URL is not set  → falls back to localhost:8080/api
// PRODUCTION → VITE_API_BASE_URL=https://settribe-backend.onrender.com/api
//
// To switch: set VITE_API_BASE_URL in .env.production before building.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') ||
  'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor — attach JWT token ────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('settribe_jwt_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 globally ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('settribe_jwt_token');
      localStorage.removeItem('settribe_user_id');
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
