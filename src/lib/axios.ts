/**
 * src/lib/axios.ts
 *
 * Central Axios instance for the Streamify web app.
 *
 * ─── Request interceptor ────────────────────────────────────────────────────
 *  Attaches `Authorization: Bearer <token>` from the Zustand auth store
 *  to every outgoing request automatically.
 *
 * ─── Response interceptor ───────────────────────────────────────────────────
 *  On a 401:
 *   1. Calls POST /auth/refresh — the backend reads the httpOnly refresh cookie
 *      and returns a new access token.
 *   2. Stores the new token in Zustand.
 *   3. Retries the original failed request once with the new token.
 *  On double-failure (refresh also returns 401): clears auth and redirects
 *  to /login.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// ── Lazy import to avoid circular dependency ──────────────────────────────────
// The store imports nothing from axios, but if we import the store at module
// level here we'd create a circular reference. Instead we read it lazily inside
// the interceptor closure.
const getAuthStore = () => import('@/stores/authStore').then((m) => m.useAuthStore);

// ─── Base URL ─────────────────────────────────────────────────────────────────
// In development: Vite proxies /api → http://localhost:3000 (api-gateway).
// In production:  Set VITE_API_BASE_URL to the gateway's public URL.
const BASE_URL = '/api';

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send / receive the httpOnly refresh-token cookie
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Request interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  // Lazily pull the token from Zustand on every request
  const storeModule = await getAuthStore();
  const token = storeModule.getState().accessToken;

  if (token && config.headers) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  return config;
});

// ─── Response interceptor ─────────────────────────────────────────────────────
// Track whether we are already refreshing to avoid infinite loops
let isRefreshing = false;
// Queue of failed requests waiting for the refresh to complete
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

interface AxiosRequestConfigWithRetry extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

api.interceptors.response.use(
  // Pass-through success responses unchanged
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfigWithRetry | undefined;

    // Only handle 401 Unauthorized, and only once per request (_retry flag)
    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Skip refresh attempt if the failing call IS the refresh endpoint itself or the login endpoint
    if (originalRequest.url?.includes('/auth/refresh') || originalRequest.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Another request is already refreshing — queue this one
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
          }
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // The refresh cookie is sent automatically via `withCredentials: true`
      const { data } = await api.post<{ data: { accessToken: string } }>('/auth/refresh');
      const newToken = data.data.accessToken;

      // Persist the new token in Zustand
      const storeModule = await getAuthStore();
      storeModule.getState().setAccessToken(newToken);

      // Update the Authorization header for future requests
      if (api.defaults.headers) {
        (api.defaults.headers as Record<string, string>)['Authorization'] = `Bearer ${newToken}`;
      }

      processQueue(null, newToken);

      // Retry the original request with the fresh token
      if (originalRequest.headers) {
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
      }
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      // Refresh failed — the session is dead. Clear auth and redirect.
      const storeModule = await getAuthStore();
      storeModule.getState().clearAuth();
      const { queryClient } = await import('@/lib/react-query');
      queryClient.clear();

      // Navigate to login — use history API to avoid a full page reload
      window.history.pushState(null, '', '/login');
      window.dispatchEvent(new PopStateEvent('popstate'));

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default api;
