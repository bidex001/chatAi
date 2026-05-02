import axios from "axios";

const AUTH_TOKEN_STORAGE_KEY = "chatai_auth_token";

function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000/api`;
  }

  return "http://localhost:8000/api";
}

function canUseBrowserStorage() {
  return typeof window !== "undefined" && !!window.localStorage;
}

export function getAuthToken() {
  if (!canUseBrowserStorage()) {
    return "";
  }

  return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY) || "";
}

export function persistAuthToken(token) {
  if (!canUseBrowserStorage()) {
    return;
  }

  const nextToken = token?.trim();

  if (!nextToken) {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, nextToken);
}

export function clearAuthToken() {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (!token) {
    return config;
  }

  config.headers = config.headers ?? {};
  config.headers.Authorization = `Bearer ${token}`;

  return config;
});

export default api;
