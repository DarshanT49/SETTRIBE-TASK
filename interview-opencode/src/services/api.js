import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
const normalizedBaseUrl = rawBaseUrl ? rawBaseUrl.replace(/\/+$/, '') : '';
const fallbackBaseUrl = `http://${window.location.hostname}:8080/api`;

const api = axios.create({
  baseURL: normalizedBaseUrl || fallbackBaseUrl
});

export default api;
