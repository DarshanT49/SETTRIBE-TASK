import axios from 'axios';

const storageKey = 'settribe_api_base_url';

const normalizeBaseUrl = (value) => {
  if (!value) {
    return '';
  }

  return value.trim().replace(/\/+$/, '');
};

const getQueryBaseUrl = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  const params = new URLSearchParams(window.location.search);
  const value = params.get('apiBase');

  if (!value) {
    return '';
  }

  window.localStorage.setItem(storageKey, value);
  return value;
};

const getStoredBaseUrl = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.localStorage.getItem(storageKey) || '';
};

const queryBaseUrl = getQueryBaseUrl();
const storedBaseUrl = getStoredBaseUrl();
const rawBaseUrl = import.meta.env.VITE_API_BASE_URL;
const resolvedBaseUrl = normalizeBaseUrl(queryBaseUrl || storedBaseUrl || rawBaseUrl);
const fallbackBaseUrl = `http://${window.location.hostname}:8080/api`;

const baseURL = resolvedBaseUrl || fallbackBaseUrl;
const shouldSkipNgrokWarning = /ngrok(-free)?\.dev|ngrok\.io/i.test(baseURL);

const api = axios.create({
  baseURL,
  headers: shouldSkipNgrokWarning
    ? { 'ngrok-skip-browser-warning': 'true' }
    : undefined
});

export default api;
