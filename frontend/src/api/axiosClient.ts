import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

export const axiosClient = axios.create({
  baseURL: `${BASE_URL}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
});

// ── Request: แนบ JWT token อัตโนมัติ ─────────────────────────────────────────
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('csnews_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err),
);

// ── Response: แปลง error ให้เป็น Error object ────────────────────────────────
axiosClient.interceptors.response.use(
  (res) => res,
  (err: AxiosError<{ message?: string }>) => {
    const status  = err.response?.status;
    const message = err.response?.data?.message ?? err.message ?? 'เกิดข้อผิดพลาด';

    if (status === 401) {
      localStorage.removeItem('csnews_token');
      localStorage.removeItem('csnews_user');
      // Dispatch custom event แทน hard redirect เพื่อให้ React จัดการ
      window.dispatchEvent(new CustomEvent('auth:expired'));
    }

    return Promise.reject(new Error(message));
  },
);

export default axiosClient;
