import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/authService';
import { isBackendAvailable } from '@/api/client';
import { AxiosError } from 'axios';

// ── Role type — SECURITY_GUARD added ─────────────────────────────────────────
export type UserRole = 'SUPER_ADMIN' | 'SUB_ADMIN' | 'END_USER' | 'SECURITY_GUARD';

type LoginResponse = {
  user: AuthUser;
  token?: string;
  accessToken?: string;
  data?: {
    user: AuthUser;
    accessToken?: string;
  };
};

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  warehouseIds: string[];
  companyId: string;
  /** Permission keys for END_USER role — SUPER_ADMIN and SUB_ADMIN have all permissions */
  permissions?: string[];
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  usingMock: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  hydrateFromApi: () => Promise<void>;
  clearError: () => void;
}

// ── Mock users ────────────────────────────────────────────────────────────────
const MOCK_USERS: Array<AuthUser & { password: string }> = [
  {
    id: 'usr-001',
    name: 'Admin User',
    email: 'admin@invenpro.com',
    password: 'admin123',
    role: 'SUPER_ADMIN',
    warehouseIds: ['wh-001', 'wh-002', 'wh-003'],
    companyId: 'cmp-001',
  },
  {
    id: 'usr-002',
    name: 'Rahul Sharma',
    email: 'manager@invenpro.com',
    password: 'admin123',
    role: 'SUB_ADMIN',
    warehouseIds: ['wh-001'],
    companyId: 'cmp-001',
  },
  {
    id: 'usr-003',
    name: 'Priya Patel',
    email: 'staff@invenpro.com',
    password: 'admin123',
    role: 'END_USER',
    warehouseIds: ['wh-002'],
    companyId: 'cmp-001',
    permissions: ['SALE_ENTRY', 'STOCK_VIEW', 'REPORTS_VIEW', 'CHALLAN_ENTRY'],
  },
  // ── Security Guard mock user ──────────────────────────────────────────────
  {
    id: 'sg1',
    name: 'Suresh Patil',
    email: 'security@invenpro.com',
    password: 'guard123',
    role: 'SECURITY_GUARD',
    warehouseIds: [],
    companyId: 'cmp-001',
  },
];

const mockLogin = async (
  email: string,
  password: string,
): Promise<{ user: AuthUser; token: string } | null> => {
  await new Promise((res) => setTimeout(res, 600));
  const found = MOCK_USERS.find(
    (u) => u.email === email.toLowerCase().trim() && u.password === password,
  );
  if (!found) return null;
  const { password: _pw, ...userWithoutPw } = found;
  void _pw;
  const mockToken = btoa(
    JSON.stringify({ sub: found.id, role: found.role, exp: Date.now() + 15 * 60 * 1000 }),
  );
  return { user: userWithoutPw, token: mockToken };
};

// ── Store ─────────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      usingMock: false,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        // ── Real backend path ─────────────────────────────────────────────
        if (isBackendAvailable()) {
          try {
            const result = await authService.login(email, password) as LoginResponse;
            console.log("LOGIN RESPONSE:", result);

           const token =
  result.accessToken ||
  result.token ||
  result.data?.accessToken;

const user =
  result.user ||
  result.data?.user;

if (!token || !user) {
  throw new Error("Invalid login response");
}

            set({
              user: {
                ...result.user,
                companyId:
                  (result.user as AuthUser & { companyId?: string }).companyId ?? 'default',
              },
              accessToken: result.accessToken || result.token || result.data?.accessToken,
              isAuthenticated: true,
              isLoading: false,
              usingMock: false,
              error: null,
            });
            return true;
          } catch (err) {
            const axiosErr = err as AxiosError<{ error?: string }>;
            const msg =
              axiosErr.response?.data?.error ?? 'Login failed. Check your credentials.';
            set({ isLoading: false, error: msg, usingMock: false });
            return false;
          }
        }

        // ── Mock fallback ──────────────────────────────────────────────────
        const result = await mockLogin(email, password);
        if (!result) {
          set({ isLoading: false, error: 'Invalid email or password', usingMock: true });
          return false;
        }

        set({
          user: result.user,
          accessToken: result.token,
          isAuthenticated: true,
          isLoading: false,
          usingMock: true,
          error: null,
        });
        return true;
      },

      logout: async () => {
        if (isBackendAvailable() && get().accessToken) {
          try {
            await authService.logout();
          } catch {
            // best-effort
          }
        }
        set({ user: null, accessToken: null, isAuthenticated: false, error: null });
      },

      hydrateFromApi: async () => {
        if (!isBackendAvailable() || !get().accessToken) return;
        try {
          const me = await authService.me();
          set({
            user: {
              ...me,
              companyId: (me as AuthUser & { companyId?: string }).companyId ?? 'default',
            },
          });
        } catch {
          set({ user: null, accessToken: null, isAuthenticated: false });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'invenpro-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        usingMock: state.usingMock,
      }),
    },
  ),
);