import axios from 'axios';
import { STORAGE_KEYS, AUTH_EVENT, API_AUTH_PATH } from '../constants/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const client = axios.create({
  baseURL: API_URL,
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

const processQueue = (error: unknown, token?: string) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token || '');
    }
  });
  failedQueue = [];
};

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const isAuthEndpoint = config.url?.includes(API_AUTH_PATH);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (!isAuthEndpoint) {
    console.warn('[Request] SEM TOKEN para:', config.url);
  }
  return config;
});

client.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const original = error.config;
    console.error('[Response Error]', {
      status: error.response?.status,
      url: original?.url,
      message: error.response?.data?.message,
    });

    const isAuthEndpoint = original?.url?.includes(API_AUTH_PATH);

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            return client(original);
          })
          .catch((err) => {
            console.error('[Queue] Falha no refresh, redirecionando para login');
            localStorage.clear();
            window.dispatchEvent(new Event(AUTH_EVENT.LOGOUT));
            return Promise.reject(err);
          });
      }

      original._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        const axiosInstance = axios.create({ baseURL: API_URL });
        const response = await axiosInstance.post('/api/auth/refresh', {
          refreshToken,
        });

        const newAccessToken = response.data.accessToken;
        if (!newAccessToken) {
          throw new Error('No access token in response');
        }

        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
        if (response.data.refreshToken) {
          localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.data.refreshToken);
        }

        client.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        original.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        isRefreshing = false;

        return client(original);
      } catch (err) {
        console.error('[Refresh] Erro:', err);
        processQueue(err);
        isRefreshing = false;
        localStorage.clear();
        window.dispatchEvent(new Event(AUTH_EVENT.LOGOUT));
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);
