import axios from 'axios';

const TOKEN_KEY = 'washflow_token';

export const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || '') + '/api',
});

// Her istege JWT ekle.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401'de oturumu dusur (public takip sayfasi haric).
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && !location.pathname.startsWith('/t/')) {
      localStorage.removeItem(TOKEN_KEY);
      if (location.pathname !== '/login') location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

/** Axios hatasindan okunabilir mesaj cikarir. */
export function apiError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.error || err.message || 'Bir hata olustu.';
  }
  return 'Bir hata olustu.';
}
