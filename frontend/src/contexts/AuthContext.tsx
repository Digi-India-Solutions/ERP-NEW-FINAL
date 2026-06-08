

// import {
//   createContext, useContext, useState,
//   useEffect, useCallback, ReactNode,
// } from "react";
// import { useNavigate } from "react-router-dom";
// import { postData, getData } from '../services/FetchNodeServices';


// type Action = "create" | "view" | "edit" | "delete";

// type PermissionSet = {
//   [module: string]: {
//     create?: boolean;
//     view?: boolean;
//     edit?: boolean;
//     delete?: boolean;
//   };
// };


// export type AdditionalControls = {
//   exportData?: boolean;
//   convertChallan?: boolean;
//   editLockedRecords?: boolean;
//   viewAllWarehouses?: boolean;
//   approveStockTransfer?: boolean;
//   viewFinancialReports?: boolean;
//   manageUserPermissions?: boolean;
//   approveStockAdjustment?: boolean;
// };


// export interface User {
//   id: string;
//   email: string;
//   role: string;
//   name: string;
//   companyId?: string;
//   token?: string;
//   permissions?: PermissionSet;
//   additionalControls?: AdditionalControls;
// }

// interface CompanyData {
//   id:              string;
//   companyName:     string;
//   status:          "active" | "suspended";
//   assignedPlan:    string;
//   planExpiryDate:  string;
//   allowedFeatures: string[];
// }

// interface AuthContextType {
//   user: User | null;
//   companyData: CompanyData | null;
//   login: (user: User) => void;
//      refreshUser:        () => Promise<void>;
//     loading:            boolean;
//   logout: () => void;
//   forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
//   resetPassword: (token: string, password: string) => Promise<{ success: boolean; message: string }>;
//   isAuthenticated: boolean;
//   hasPermission: (module: string, action: Action) => boolean;
//      hasFeatureAccess:   (featureId: string) => boolean;
//   hasControl: (control: keyof AdditionalControls) => boolean;
//   isCompanySuspended: () => boolean;
// }

// // ─── Storage helpers ──────────────────────────────────────────────────────────

// const KEYS = {
//   USER:    'auth_user',
//   COMPANY: 'auth_company',
//   TOKEN:   'token',
// } as const;

// const saveToStorage = (user: User, company?: CompanyData) => {
//   localStorage.setItem(KEYS.USER,  JSON.stringify(user));
//   localStorage.setItem(KEYS.TOKEN, user.token);           // ✅ save raw token, NOT JSON.stringify
//   if (company) {
//     localStorage.setItem(KEYS.COMPANY, JSON.stringify(company));
//   }
// };

// const clearStorage = () => {
//   Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
//   // ✅ also clear legacy keys used in old code
//   localStorage.removeItem('user');
//   localStorage.removeItem('invenpro-auth');
// };

// const getStoredUser = (): User | null => {
//   try {
//     const raw   = localStorage.getItem(KEYS.USER);
//     const token = localStorage.getItem(KEYS.TOKEN);
//     if (!raw || !token) return null;
//     const parsed = JSON.parse(raw) as User;
//     return { ...parsed, token };
//   } catch {
//     return null;
//   }
// };

// const getStoredCompany = (): CompanyData | null => {
//   try {
//     const raw = localStorage.getItem(KEYS.COMPANY);
//     return raw ? (JSON.parse(raw) as CompanyData) : null;
//   } catch {
//     return null;
//   }
// };

// // ─── Normalize API user → local User shape ────────────────────────────────────

// function normalizeUser(apiUser: any, token: string): User {
//   return {
//     id:        apiUser?.id        ?? apiUser?.user_id ?? '',
//     email:     apiUser?.email     ?? apiUser?.email_address ?? '',
//     name:      apiUser?.name      ?? apiUser?.full_name ?? apiUser?.email ?? 'User',
//     role:      ((apiUser?.role ?? '') as string)
//                  .toUpperCase()
//                  .replace(/\s+/g, '_') as UserRole,
//     companyId: apiUser?.company_id ?? apiUser?.companyId ?? '',
//     token,
//   };
// }

// // ─── Context ──────────────────────────────────────────────────────────────────

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// // ─── Provider ─────────────────────────────────────────────────────────────────

// export function AuthProvider({ children }: { children: ReactNode }) {
//   const [user,        setUser]        = useState<User | null>(null);
//   const [companyData, setCompanyData] = useState<CompanyData | null>(null);
//   const [loading,     setLoading]     = useState(true);
//   const navigate = useNavigate();



//   // ── Bootstrap: restore from storage, then verify with API ──────────────────
//   useEffect(() => {
//     const bootstrap = async () => {
//       const storedUser    = getStoredUser();
//       const storedCompany = getStoredCompany();

//       // ✅ Immediately restore from storage so UI doesn't flash to login
//       if (storedUser) {
//         setUser(storedUser);
//         setCompanyData(storedCompany);
//       }

//       // ✅ Then verify token with API in background
//       const token = localStorage.getItem(KEYS.TOKEN);
//       if (!token) {
//         setLoading(false);
//         return;
//       }

//       try {
//         const res = await getData("api/v1/auth/me");
//         const apiUser = res?.data || res?.user || {};
//         console.log("apiUser ==>", apiUser)
//         const normalizedUser = {
//           email: apiUser?.email ?? apiUser?.email_address ?? apiUser?.name ?? "",
//           role: (apiUser?.role || ""),
//           name: apiUser?.name || apiUser?.full_name || apiUser?.email || "User",
//           companyId: apiUser?.company_id || apiUser?.companyId,
//           token,
//           permissions: apiUser?.permissions || {},
//           additionalControls: apiUser?.additionalControls || {},
//           id: apiUser?.id || ''
//         };

//         setUser(normalizedUser);
//         localStorage.setItem("auth_user", JSON.stringify(normalizedUser));
//         localStorage.setItem("user", JSON.stringify(normalizedUser));
//       } catch (err) {
//         console.error('Auth bootstrap failed:', err);
//         // ✅ Keep stored user on network error (offline support)
//         // Only logout if no stored user exists
//         if (!storedUser) {
//           await performLogout();
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     bootstrap();
//   }, []); // eslint-disable-line react-hooks/exhaustive-deps

//   // ── Internal logout (no navigate — used in bootstrap) ─────────────────────
//   const performLogout = useCallback(async () => {
//     try {
//       await postData('api/v1/auth/logout', {});
//     } catch { /* ignore — logout API failure shouldn't block client logout */ }
//     setUser(null);
//     setCompanyData(null);
//     clearStorage();
//   }, []);

//   // ── Login ──────────────────────────────────────────────────────────────────
//   const login = useCallback((userData: User, company?: CompanyData) => {
//     setUser(userData);
//     if (company) setCompanyData(company);
//     saveToStorage(userData, company);
//     navigate('/', { replace: true });
//   }, [navigate]);

//   // ── Logout ─────────────────────────────────────────────────────────────────
//   const logout = useCallback(async (): Promise<void> => {
//     await performLogout();
//     navigate('/login', { replace: true });
//   }, [navigate, performLogout]);

//   // ── Refresh user from API (call after profile update etc.) ────────────────
//   const refreshUser = useCallback(async (): Promise<void> => {
//     const token = localStorage.getItem(KEYS.TOKEN);
//     if (!token) return;
//     try {
//       const res = await getData('api/v1/auth/me');
//       if (res?.success || res?.data) {
//         const apiUser = res?.data?.user ?? res?.data ?? res?.user ?? {};
//         const freshUser = normalizeUser(apiUser, token);
//         setUser(freshUser);
//         saveToStorage(freshUser);
//       }
//     } catch (err) {
//       console.error('refreshUser failed:', err);
//     }
//   }, []);

//   // ── Forgot password ────────────────────────────────────────────────────────
//   const forgotPassword = useCallback(async (email: string) => {
//     try {
//       const res = await postData('api/v1/auth/forgot-password', { email });
//       return {
//         success: res?.success ?? true,
//         message: res?.message ?? 'Reset link sent to your email',
//       };
//     } catch (err: any) {
//       return {
//         success: false,
//         message: err?.response?.data?.message ?? 'Something went wrong',
//       };
//     }
//   }, []);

//   // ── Reset password ─────────────────────────────────────────────────────────
//   const resetPassword = useCallback(async (token: string, password: string) => {
//     try {
//       const res = await postData(`api/v1/auth/reset-password/${token}`, { password });
//       return {
//         success: res?.success ?? true,
//         message: res?.message ?? 'Password reset successful',
//       };
//     } catch (err: any) {
//       return {
//         success: false,
//         message: err?.response?.data?.message ?? 'Reset failed. Please try again.',
//       };
//     }
//   }, []);

//   // ── Feature access ─────────────────────────────────────────────────────────
//   const hasFeatureAccess = useCallback((featureId: string): boolean => {
//     if (!user) return false;
//     if (user.role === 'SUPER_ADMIN') return true;
//     if (user.role === 'COMPANY_ADMIN' && companyData) {
//       return companyData.allowedFeatures.includes(featureId);
//     }
//     return false;
//   }, [user, companyData]);
//   };

//  const hasPermission = (module: string, action: Action): boolean => {
//   if (!user) return false;

//   // 🔥 SUPER ADMIN BYPASS
//   if (user.role === "SUPER_ADMIN") return true;

//   return user.permissions?.[module]?.[action] ?? false;
// };

// const hasControl = (control: keyof AdditionalControls): boolean => {
//   if (!user) return false;

//   // 🔥 SUPER ADMIN BYPASS
//   if (user.role === "SUPER_ADMIN") return true;

//   return user.additionalControls?.[control] ?? false;
// };


//   // ── Company suspended ──────────────────────────────────────────────────────
//   const isCompanySuspended = useCallback(
//     (): boolean => companyData?.status === 'suspended',
//     [companyData]
//   );

//   // ─────────────────────────────────────────────────────────────────────────
//   return (
//     <AuthContext.Provider
//       value={{
//         user,
//         companyData,
//         login,
//         logout,
//         forgotPassword,
//         resetPassword,
//         refreshUser,
//         hasFeatureAccess,
//         isAuthenticated: !!user,
//         hasPermission,
//         hasControl,
//         isCompanySuspended,
//         loading,
//       }}
//     >
//       {children}
//     </AuthContext.Provider>
//   );
// }

// // ─── Hook ─────────────────────────────────────────────────────────────────────

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (!context) throw new Error('useAuth must be used within AuthProvider');
//   return context;
// }

import {
  createContext, useContext, useState,
  useEffect, useCallback, ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { postData, getData } from '../services/FetchNodeServices';


type Action = "create" | "view" | "edit" | "delete";

type PermissionSet = {
  [module: string]: {
    create?: boolean;
    view?: boolean;
    edit?: boolean;
    delete?: boolean;
  };
};

// ✅ Added missing UserRole type
type UserRole =
  | "SUPER_ADMIN"
  | "COMPANY_ADMIN"
  | "MANAGER"
  | "STAFF"
  | string;

export type AdditionalControls = {
  exportData?: boolean;
  convertChallan?: boolean;
  editLockedRecords?: boolean;
  viewAllWarehouses?: boolean;
  approveStockTransfer?: boolean;
  viewFinancialReports?: boolean;
  manageUserPermissions?: boolean;
  approveStockAdjustment?: boolean;
};

  
export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  companyId?: string;
  token?: string;
  permissions?: PermissionSet;
  additionalControls?: AdditionalControls;
}

interface CompanyData {
  id: string;
  companyName: string;
  status: "active" | "suspended";
  assignedPlan: string;
  planExpiryDate: string;
  allowedFeatures: string[];
}

interface AuthContextType {
  user: User | null;
  companyData: CompanyData | null;
  // ✅ Fixed: login signature now accepts optional company param (consistent with implementation)
  login: (user: User, company?: CompanyData) => void;
  refreshUser: () => Promise<void>;
  loading: boolean;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (token: string, password: string) => Promise<{ success: boolean; message: string }>;
  isAuthenticated: boolean;
  hasPermission: (module: string, action: Action) => boolean;
  hasFeatureAccess: (featureId: string) => boolean;
  hasControl: (control: keyof AdditionalControls) => boolean;
  isCompanySuspended: () => boolean;
}

// ─── Storage helpers ──────────────────────────────────────────────────────────

const KEYS = {
  USER: 'auth_user',
  COMPANY: 'auth_company',
  TOKEN: 'token',
} as const;

const saveToStorage = (user: User, company?: CompanyData) => {
  localStorage.setItem(KEYS.USER, JSON.stringify(user));
  localStorage.setItem(KEYS.TOKEN, user.token ?? '');
  if (company) {
    localStorage.setItem(KEYS.COMPANY, JSON.stringify(company));
  }
};

const clearStorage = () => {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  localStorage.removeItem('user');
  localStorage.removeItem('invenpro-auth');
};

const getStoredUser = (): User | null => {
  try {
    const raw = localStorage.getItem(KEYS.USER);
    const token = localStorage.getItem(KEYS.TOKEN);
    if (!raw || !token) return null;
    const parsed = JSON.parse(raw) as User;
    return { ...parsed, token };
  } catch {
    return null;
  }
};

const getStoredCompany = (): CompanyData | null => {
  try {
    const raw = localStorage.getItem(KEYS.COMPANY);
    return raw ? (JSON.parse(raw) as CompanyData) : null;
  } catch {
    return null;
  }
};

// ─── Normalize API user → local User shape ────────────────────────────────────

function normalizeUser(apiUser: any, token: string): User {
  return {
    id: apiUser?.id ?? apiUser?.user_id ?? '',
    email: apiUser?.email ?? apiUser?.email_address ?? '',
    name: apiUser?.name ?? apiUser?.full_name ?? apiUser?.email ?? 'User',
    // ✅ Cast to UserRole (was incorrectly cast to undefined type before)
    role: ((apiUser?.role ?? '') as string)
      .toUpperCase()
      .replace(/\s+/g, '_') as UserRole,
    companyId: apiUser?.company_id ?? apiUser?.companyId ?? '',
    token,
    permissions: apiUser?.permissions ?? {},
    additionalControls: apiUser?.additionalControls ?? {},
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ── Bootstrap: restore from storage, then verify with API ──────────────────
  useEffect(() => {
  const bootstrap = async () => {
    const storedUser = getStoredUser();
    const storedCompany = getStoredCompany();
    const token = localStorage.getItem(KEYS.TOKEN);

    if (!token) {
      // No token — use stored if available
      if (storedUser) {
        setUser(storedUser);
        setCompanyData(storedCompany);
      }
      setLoading(false);
      return;
    }

    // Have token — always fetch fresh from /me before rendering
    // Set stored user temporarily so UI isn't blank during fetch
    if (storedUser) setUser(storedUser);

    try {
      const res = await getData("api/v1/auth/me");
      const apiUser = res?.data || res?.user || {};
      const normalizedUser = normalizeUser(apiUser, token); // ← use helper

      setUser(normalizedUser); // ← overwrites stale stored user
      if (storedCompany) setCompanyData(storedCompany);
      localStorage.setItem("auth_user", JSON.stringify(normalizedUser));
      localStorage.setItem("user", JSON.stringify(normalizedUser));
    } catch (err) {
      console.error('Auth bootstrap failed:', err);
      if (!storedUser) await performLogout();
      // else keep storedUser (already set above)
    } finally {
      setLoading(false); // ← only set false AFTER /me completes
    }
  };
  bootstrap();
}, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Internal logout ────────────────────────────────────────────────────────
  const performLogout = useCallback(async () => {
    try {
      await postData('api/v1/auth/logout', {});
    } catch { /* ignore */ }
    setUser(null);
    setCompanyData(null);
    setLoading(false); // ✅ Reset loading on logout to avoid stuck states
    clearStorage();
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = useCallback((userData: User, company?: CompanyData) => {
    setUser(userData);
    if (company) setCompanyData(company);
    saveToStorage(userData, company);
    navigate('/', { replace: true });
  }, [navigate]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = useCallback(async (): Promise<void> => {
    await performLogout();
    navigate('/login', { replace: true });
  }, [navigate, performLogout]);

  // ── Refresh user from API ──────────────────────────────────────────────────
  const refreshUser = useCallback(async (): Promise<void> => {
    const token = localStorage.getItem(KEYS.TOKEN);
    if (!token) return;
    try {
      const res = await getData('api/v1/auth/me');
      if (res?.success || res?.data) {
        const apiUser = res?.data?.user ?? res?.data ?? res?.user ?? {};
        const freshUser = normalizeUser(apiUser, token);
        setUser(freshUser);
        saveToStorage(freshUser);
      }
    } catch (err) {
      console.error('refreshUser failed:', err);
    }
  }, []);

  // ── Forgot password ────────────────────────────────────────────────────────
  const forgotPassword = useCallback(async (email: string) => {
    try {
      const res = await postData('api/v1/auth/forgot-password', { email });
      return {
        success: res?.success ?? true,
        message: res?.message ?? 'Reset link sent to your email',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message ?? 'Something went wrong',
      };
    }
  }, []);

  // ── Reset password ─────────────────────────────────────────────────────────
  const resetPassword = useCallback(async (token: string, password: string) => {
    try {
      const res = await postData(`api/v1/auth/reset-password/${token}`, { password });
      return {
        success: res?.success ?? true,
        message: res?.message ?? 'Password reset successful',
      };
    } catch (err: any) {
      return {
        success: false,
        message: err?.response?.data?.message ?? 'Reset failed. Please try again.',
      };
    }
  }, []);

  // ── Feature access ─────────────────────────────────────────────────────────
  const hasFeatureAccess = useCallback((featureId: string): boolean => {
    if (!user) return false;
    if (user.role === 'SUPER_ADMIN') return true;
    if (user.role === 'COMPANY_ADMIN' && companyData) {
      return companyData.allowedFeatures.includes(featureId);
    }
    return false;
  }, [user, companyData]);
  

 const hasPermission = (module: string, action: Action): boolean => {
  if (!user) return false;

  if (user.role === "SUPER_ADMIN") return true;

  return user.permissions?.[module]?.[action] ?? false;
};

// const hasControl = (control: keyof AdditionalControls): boolean => {
//   if (!user) return false;

//   // 🔥 SUPER ADMIN BYPASS
//   if (user.role === "SUPER_ADMIN") return true;

//   return user.additionalControls?.[control] ?? false;
// };

  // ── Has additional control ─────────────────────────────────────────────────
  const hasControl = useCallback((control: keyof AdditionalControls): boolean => {
    if (!user) return false;
    if (user.role === "SUPER_ADMIN") return true;
    return user.additionalControls?.[control] ?? false;
  }, [user]);

  // ── Company suspended ──────────────────────────────────────────────────────
  const isCompanySuspended = useCallback(
    (): boolean => companyData?.status === 'suspended',
    [companyData]
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <AuthContext.Provider
      value={{
        user,
        companyData,
        login,
        logout,
        forgotPassword,
        resetPassword,
        refreshUser,
        hasFeatureAccess,
        isAuthenticated: !!user,
        hasPermission,
        hasControl,
        isCompanySuspended,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}