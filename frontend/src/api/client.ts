import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Set VITE_API_URL in your .env file when running the backend locally.
// Example: VITE_API_URL=http://localhost:7000m

const RAW_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() ||
  'http://localhost:7000';
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, '').replace(/\/api\/v1$/, '');

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 16000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request interceptor: attach access token ──────────────────────────────
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const tokenFromTokenKey = localStorage.getItem('token');
  const tokenFromAuthUser = (() => {
    const raw =
      localStorage.getItem('auth_user') || localStorage.getItem('user');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { token?: string };
      return parsed?.token ?? null;
    } catch {
      return null;
    }
  })();

  const tokenFromStore = (() => {
    const raw = localStorage.getItem('invenpro-auth');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as { state?: { accessToken?: string } };
      return parsed?.state?.accessToken ?? null;
    } catch {
      return null;
    }
  })();

  const token = tokenFromStore || tokenFromTokenKey || tokenFromAuthUser;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 (attempt token refresh) ─────────────
let isRefreshing = false;
let failQueue: Array<{
  resolve: (v: unknown) => void;
  reject: (e: unknown) => void;
}> = [];

const processQueue = (
  error: AxiosError | null,
  token: string | null = null,
) => {
  failQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failQueue = [];
};

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalReq = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalReq._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failQueue.push({ resolve, reject });
        }).then((token) => {
          originalReq.headers.Authorization = `Bearer ${token as string}`;
          return apiClient(originalReq);
        });
      }

      originalReq._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<{
          success: boolean;
          data: { accessToken: string };
        }>(`${BASE_URL}/api/v1/auth/refresh`, {}, { withCredentials: true });
        const newToken = data.data.accessToken;

        // Update stored token
        const raw = localStorage.getItem('invenpro-auth');
        if (raw) {
          const parsed = JSON.parse(raw) as { state?: Record<string, unknown> };
          if (parsed.state) {
            parsed.state.accessToken = newToken;
            localStorage.setItem('invenpro-auth', JSON.stringify(parsed));
          }
        }

        processQueue(null, newToken);
        originalReq.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalReq);
      } catch (refreshError) {
        processQueue(refreshError as AxiosError, null);
        // Clear auth state on refresh failure
        localStorage.removeItem('invenpro-auth');
        window.location.href = `${__BASE_PATH__}login`;
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ── Typed API response unwrapper ─────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  code?: string;
  details?: Array<{ field: string; message: string }>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export const isBackendAvailable = (): boolean => BASE_URL !== '';
