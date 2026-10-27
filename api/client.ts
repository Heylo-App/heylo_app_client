import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { DeviceEventEmitter } from 'react-native';

import { env } from '@/config/env';
import { secureStorage } from '@/utils/storage';
import { getUserFriendlyError } from '@/utils/errorMessages';

import { endpoints } from './endpoints';

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let isRefreshing = false;
let refreshQueue: ((token: string | null) => void)[] = [];

function processQueue(token: string | null) {
  refreshQueue.forEach((cb) => cb(token));
  refreshQueue = [];
}

/**
 * Emit a global event when the user's session is definitively expired.
 * The root layout listens for this to redirect to the welcome screen and show a friendly alert.
 */
function emitSessionExpired(message?: string) {
  DeviceEventEmitter.emit('session:expired', { message });
}

apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await secureStorage.getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    const status = error.response?.status;
    const errorMsg = String((error.response?.data as any)?.message || '').toLowerCase();
    const isUserNotFound = status === 404 && errorMsg.includes('user not found');
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register');

    // If an authenticated request gets "User not found" (e.g. account deleted from DB),
    // immediately clear session and emit session:expired so the user isn't stuck with ghost auth
    if (isUserNotFound && !isAuthEndpoint && originalRequest?.headers?.Authorization) {
      await secureStorage.clearTokens();
      const friendlyMsg = 'Your account was not found. Please log in or register again.';
      emitSessionExpired(friendlyMsg);
      return Promise.reject(new Error(friendlyMsg));
    }

    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push((token) => {
          if (!token) {
            reject(error);
            return;
          }
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          resolve(apiClient(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await secureStorage.getRefreshToken();
      if (!refreshToken) {
        // No refresh token available — session is over
        await secureStorage.clearTokens();
        const friendlyMsg = 'Your session has expired. Please log in again.';
        emitSessionExpired(friendlyMsg);
        return Promise.reject(new Error(friendlyMsg));
      }

      const { data } = await axios.post(`${env.apiUrl}${endpoints.auth.refresh}`, {
        refreshToken,
      });

      const newToken = data.accessToken as string;
      await secureStorage.setToken(newToken);
      processQueue(newToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError: any) {
      processQueue(null);
      await secureStorage.clearTokens();
      const serverMsg = refreshError?.response?.data?.message;
      const isNotFound =
        typeof serverMsg === 'string' && serverMsg.toLowerCase().includes('user not found');
      const friendlyMsg = isNotFound
        ? 'Your account was not found. Please log in or register again.'
        : 'Your session has expired. Please log in again.';
      emitSessionExpired(friendlyMsg);
      return Promise.reject(new Error(friendlyMsg));
    } finally {
      isRefreshing = false;
    }
  },
);

/**
 * Extracts a user-friendly error message from any error.
 * Use this as a convenience re-export; the full utility lives in utils/errorMessages.
 */
export function getApiErrorMessage(error: unknown): string {
  return getUserFriendlyError(error);
}
