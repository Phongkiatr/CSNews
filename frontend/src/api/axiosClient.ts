import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export const axiosClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// --- Request Interceptor: attach JWT token automatically ---
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('csnews_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err),
);

// --- Response Interceptor: normalize errors ---
axiosClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ message?: string }>) => {
    const status  = err.response?.status;
    const message = err.response?.data?.message ?? err.message ?? 'Something went wrong';

    // Token expired — clear credentials and notify the app
    if (status === 401) {
      localStorage.removeItem('csnews_token');
      localStorage.removeItem('csnews_user');
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    return Promise.reject(new Error(message));
  },
);

export default axiosClient;
