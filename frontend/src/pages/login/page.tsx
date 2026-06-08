// import { useRef, useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// // import { useAuthStore } from '@/stores/authStore';
// import { useKeyboardNav } from '@/utils/keyboardNav';
// import { useAuth } from '../../contexts/AuthContext';
// import { postData } from '../../services/FetchNodeServices';
// import { useAuthStore } from '@/stores/authStore';

// export default function LoginPage() {
//   const navigate = useNavigate();
//   const formRef = useRef<HTMLFormElement>(null);
//   useKeyboardNav(formRef as React.RefObject<HTMLElement>);

//   // Auth context/store
  

//   // Local State
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [showPassword, setShowPassword] = useState(false);
//   const [submitted, setSubmitted] = useState(false);
//   const [error, setError] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const loginStore = useAuthStore((s) => s.login);
// const user = useAuthStore((s) => s.user);
// const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

//   const clearError = () => setError('');

//   // 1. Feature: Automatic Redirect if already authenticated
//   useEffect(() => {
//   if (isAuthenticated && user) {
//     if (user.role === 'SECURITY_GUARD') {
//       navigate('/guard/dashboard', { replace: true });
//     } else {
//       navigate('/', { replace: true });
//     }
//   }
// }, [isAuthenticated, user, navigate]);


//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setSubmitted(true);
//     clearError();

//     if (!email || !password) return;

//     setIsLoading(true);

//     try {
//       const payload = { email, password };
//       const data = await postData('api/v1/auth/login', payload);

//       if (!data || data.success === false) {
//         setError(data?.message || "Login failed");
//         setIsLoading(false);
//         return;
//       }


//       const apiUser = data?.data?.user || data?.user || null;
//       console.log("SLOGIN=>" , apiUser)
//       const token =
//         data?.data?.accessToken ||
//         data?.accessToken ||
//         data?.token ||
//         null;

//         if (!data.success) {
//           setError(data.message || "Login failed");
//           return;
//         }

//       if (!apiUser) {
//         setError(data?.message || "Invalid credentials");
//         setIsLoading(false);
//         return;
//       }

//       if (!token) {
//         alert("Token missing");
//         setIsLoading(false);
//         return;
//       }

//       const normalizedUser = {
//         email: apiUser.email,
//         role: apiUser.role,
//         name: apiUser.name || apiUser.email,
//         companyId: apiUser.companyId || apiUser.company_id,
//         permissions: apiUser.permissions || {},
//         additionalControls: apiUser.additionalControls || {},
//         token: token,
//       };

//       // 2. Feature: Context Login and conditional navigation
//       contextLogin(normalizedUser);
      
//       if (normalizedUser.role === 'SECURITY_GUARD') {
//         navigate('/guard/dashboard');
//       } else {
//         navigate('/');
//       }

//     } catch (err) {
//       console.error(err);
//       setError("Something went wrong");
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const emailError = submitted && !email ? "Email is required" : "";
//   const passwordError = submitted && !password ? "Password is required" : "";

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1e293b] to-slate-800 flex items-center justify-center p-4">
//       <div className="absolute inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#4f46e5]/10 rounded-full blur-3xl" />
//         <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
//         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4f46e5]/5 rounded-full blur-3xl" />
//       </div>

//       <div className="relative w-full max-w-sm">
//         <div className="bg-white rounded-2xl shadow-2xl p-8">
//           <div className="flex flex-col items-center mb-8">
//             <div className="w-14 h-14 rounded-2xl bg-[#4f46e5] flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
//               <img
//                 src="https://public.readdy.ai/ai/img_res/562db67e-18cd-4892-ada1-aa9c5633c1ae.png"
//                 alt="InvenPro"
//                 className="w-9 h-9 object-contain brightness-0 invert"
//               />
//             </div>
//             <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">InvenPro</h1>
//             <p className="text-sm text-[#64748b] mt-1">Sign in to your workspace</p>
//           </div>

//           {error && (
//             <div className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200">
//               <div className="w-4 h-4 flex items-center justify-center shrink-0">
//                 <i className="ri-error-warning-fill text-red-500 text-sm" />
//               </div>
//               <p className="text-sm text-red-600">{error}</p>
//               <button onClick={clearError} className="ml-auto w-4 h-4 flex items-center justify-center text-red-400 hover:text-red-600 cursor-pointer">
//                 <i className="ri-close-line text-sm" />
//               </button>
//             </div>
//           )}

//           <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
//             <div>
//               <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1.5">
//                 Email Address <span className="text-red-500">*</span>
//               </label>
//               <div className="relative">
//                 <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center pointer-events-none">
//                   <i className="ri-mail-line text-[#94a3b8] text-sm" />
//                 </div>
//                 <input
//                   type="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   placeholder="admin@invenpro.com"
//                   data-nav-index="0"
//                   className={`w-full h-10 pl-9 pr-4 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 transition-colors ${emailError ? 'border-red-400 focus:border-red-400' : 'border-[#e2e8f0] focus:border-[#4f46e5]'}`}
//                   autoComplete="email"
//                   autoFocus
//                 />
//               </div>
//               {emailError && <p className="mt-1 text-xs text-red-500">{emailError}</p>}
//             </div>

//             <div>
//               <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1.5">
//                 Password <span className="text-red-500">*</span>
//               </label>
//               <div className="relative">
//                 <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center pointer-events-none">
//                   <i className="ri-lock-line text-[#94a3b8] text-sm" />
//                 </div>
//                 <input
//                   type={showPassword ? 'text' : 'password'}
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   placeholder="Enter your password"
//                   data-nav-index="1"
//                   className={`w-full h-10 pl-9 pr-10 rounded-lg border text-sm text-[#1e293b] bg-white focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 transition-colors ${passwordError ? 'border-red-400 focus:border-red-400' : 'border-[#e2e8f0] focus:border-[#4f46e5]'}`}
//                   autoComplete="current-password"
//                 />
//                 <button
//                   type="button"
//                   onClick={() => setShowPassword((v) => !v)}
//                   className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center text-[#94a3b8] hover:text-[#64748b] transition-colors cursor-pointer"
//                 >
//                   <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-sm`} />
//                 </button>
//               </div>
//               {passwordError && <p className="mt-1 text-xs text-red-500">{passwordError}</p>}
//             </div>

//             <div className="flex justify-end">
//               <button
//                 type="button"
//                 onClick={() => navigate('/forgot-password')}
//                 className="text-xs text-[#4f46e5] hover:text-indigo-700 font-medium cursor-pointer"
//                 data-nav-index="2"
//               >
//                 Forgot Password?
//               </button>
//             </div>

//             <button
//               type="submit"
//               disabled={isLoading}
//               data-nav-index="3"
//               className="w-full h-10 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 mt-2 whitespace-nowrap"
//             >
//               {isLoading ? (
//                 <>
//                   <i className="ri-loader-4-line animate-spin text-base" />
//                   Signing in...
//                 </>
//               ) : (
//                 <>
//                   <i className="ri-login-box-line text-base" />
//                   Sign In
//                 </>
//               )}
//             </button>
//           </form>

//           {/* 3. Feature: Updated Demo Credentials */}
//           <div className="mt-6 pt-5 border-t border-[#e2e8f0]">
//             <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-3 text-center">Demo Credentials</p>
//             <div className="space-y-2">
//               {[
//                 { label: 'Super Admin', email: 'admin@invenpro.com', password: 'admin123' },
//                 { label: 'Manager', email: 'manager@invenpro.com', password: 'admin123' },
//                 { label: 'Staff', email: 'staff@invenpro.com', password: 'admin123' },
//                 { label: 'Security Guard', email: 'security@invenpro.com', password: 'guard123' },
//               ].map((cred) => (
               
//                 <button
//                   key={cred.email}
//                   type="button"
//                   onClick={() => { setEmail(cred.email); setPassword(cred.password); clearError(); }}
//                   className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-[#f8fafc] hover:bg-indigo-50 border border-[#e2e8f0] hover:border-[#4f46e5]/30 transition-all cursor-pointer group"
//                 >
//                   <div className="flex items-center gap-2">
//                     <span className="text-xs font-semibold text-[#4f46e5] group-hover:text-indigo-700">{cred.label}</span>
//                     <span className="text-xs text-[#64748b]">{cred.email}</span>
//                   </div>
//                   <i className="ri-arrow-right-line text-[#94a3b8] group-hover:text-[#4f46e5] text-sm" />
//                 </button>
                 
//               ))}
//             </div>
//           </div>
//         </div>

//         <p className="text-center text-xs text-slate-500 mt-5">
//           InvenPro ERP &copy; 2026 — Keyboard-first. GST-ready.
//         </p>
//       </div>
//     </div>
//   );
// }


// function contextLogin(normalizedUser: { email: any; role: any; name: any; companyId: any; permissions: any; additionalControls: any; token: any; }) {
//   if (!normalizedUser || !normalizedUser.token) return;
// console.log("A==>" ,normalizedUser)
//   try {
//     const login = useAuthStore.getState().login;

//     if (typeof login === 'function') {
//       login(normalizedUser);
//     }

//     if (typeof window !== 'undefined') {
//       localStorage.setItem('token', normalizedUser.token);
//       localStorage.setItem('user', JSON.stringify(normalizedUser));
//     }
//   } catch (error) {
//     console.error('Failed to set login context', error);
//   }
// }


import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeyboardNav } from '@/utils/keyboardNav';
import { useAuthStore } from '@/stores/authStore';
import { postData } from '../../services/FetchNodeServices';
import { useAuth } from '../../contexts/AuthContext';
// ─── Types ────────────────────────────────────────────────────────────────────



interface NormalizedUser {
  email: string;
  role: string;
  name: string;
  companyId: string;
  permissions: Record<string, any>;
  additionalControls: Record<string, any>;
  token: string;
}

interface DemoCredential {
  label: string;
  email: string;
  password: string;
}

const DEMO_CREDENTIALS: DemoCredential[] = [
  { label: 'Super Admin',     email: 'admin@invenpro.com',    password: 'admin123' },
  { label: 'Manager',         email: 'manager@invenpro.com',  password: 'admin123' },
  { label: 'Staff',           email: 'staff@invenpro.com',    password: 'admin123' },
  { label: 'Security Guard',  email: 'security@invenpro.com', password: 'guard123' },
];

// ─── Redirect helper ──────────────────────────────────────────────────────────

function getHomePath(role: string) {
  return role === 'SECURITY_GUARD' ? '/guard/dashboard' : '/';
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate();
  const formRef  = useRef<HTMLFormElement>(null);
  useKeyboardNav(formRef as React.RefObject<HTMLElement>);

  // Auth context/store
  const { login: contextLogin } = useAuth();
  // Auth store (single source of truth — no AuthContext needed alongside)
  const loginStore      = useAuthStore((s) => s.login);
  const user            = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Form state
  const [email,        setEmail]        = useState('');
  const [password,     setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [error,        setError]        = useState('');
  const [isLoading,    setIsLoading]    = useState(false);

  // ── Auto-redirect if already authenticated ───────────────────────────────

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate(getHomePath(user.role), { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const clearError = () => setError('');

  const emailError    = submitted && !email    ? 'Email is required'    : '';
  const passwordError = submitted && !password ? 'Password is required' : '';

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    clearError();

    if (!email || !password) return;

    setIsLoading(true);
    try {
      const data = await postData('api/v1/auth/login', { email, password });

      // Normalise API error responses
      if (!data || data.success === false) {
        setError(data?.message || 'Login failed');
        return;
      }

      const apiUser = data?.data?.user || data?.user || null;
      const token   = data?.data?.accessToken || data?.accessToken || data?.token || null;

      if (!apiUser) {
        setError(data?.message || 'Invalid credentials');
        return;
      }
      if (!token) {
        setError('Authentication token missing. Please try again.');
        return;
      }

      const normalizedUser = {
  id: apiUser.id || '',  

  email: apiUser.email,
  role: apiUser.role,
  name: apiUser.name || apiUser.email,
  companyId: apiUser.companyId || apiUser.company_id,
  permissions: apiUser.permissions || {},
  additionalControls: apiUser.additionalControls || {},

  token: token,
};
      // 2. Feature: Context Login and conditional navigation
      contextLogin(normalizedUser);
      
      if (normalizedUser.role === 'SECURITY_GUARD') {
        navigate('/guard/dashboard');
      } else {
        navigate('/');
      }
        loginStore(normalizedUser);
      localStorage.setItem('token', token);
      localStorage.setItem('user',  JSON.stringify(normalizedUser));

      navigate(getHomePath(normalizedUser.role), { replace: true });

    } catch (err) {
      console.error('Login error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1e293b] to-slate-800 flex items-center justify-center p-4">

      {/* Background glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#4f46e5]/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#4f46e5]/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8">

          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#4f46e5] flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
              <img
                src="https://public.readdy.ai/ai/img_res/562db67e-18cd-4892-ada1-aa9c5633c1ae.png"
                alt="InvenPro logo"
                className="w-9 h-9 object-contain brightness-0 invert"
              />
            </div>
            <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">InvenPro</h1>
            <p className="text-sm text-[#64748b] mt-1">Sign in to your workspace</p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="mb-4 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-200"
            >
              <i className="ri-error-warning-fill text-red-500 text-sm shrink-0" aria-hidden="true" />
              <p className="text-sm text-red-600 flex-1">{error}</p>
              <button
                type="button"
                onClick={clearError}
                aria-label="Dismiss error"
                className="w-4 h-4 flex items-center justify-center text-red-400 hover:text-red-600 cursor-pointer transition-colors"
              >
                <i className="ri-close-line text-sm" />
              </button>
            </div>
          )}

          {/* Form */}
          <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1.5"
              >
                Email Address <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm pointer-events-none" aria-hidden="true" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (error) clearError(); }}
                  placeholder="admin@invenpro.com"
                  autoComplete="email"
                  autoFocus
                  data-nav-index="0"
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'email-error' : undefined}
                  className={`w-full h-10 pl-9 pr-4 rounded-lg border text-sm text-[#1e293b] bg-white
                    focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 transition-colors
                    ${emailError
                      ? 'border-red-400 focus:border-red-400'
                      : 'border-[#e2e8f0] focus:border-[#4f46e5]'
                    }`}
                />
              </div>
              {emailError && (
                <p id="email-error" className="mt-1 text-xs text-red-500" role="alert">{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1.5"
              >
                Password <span className="text-red-500" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <i className="ri-lock-line absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] text-sm pointer-events-none" aria-hidden="true" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (error) clearError(); }}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  data-nav-index="1"
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'password-error' : undefined}
                  className={`w-full h-10 pl-9 pr-10 rounded-lg border text-sm text-[#1e293b] bg-white
                    focus:outline-none focus:ring-2 focus:ring-[#4f46e5]/20 transition-colors
                    ${passwordError
                      ? 'border-red-400 focus:border-red-400'
                      : 'border-[#e2e8f0] focus:border-[#4f46e5]'
                    }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center
                    text-[#94a3b8] hover:text-[#64748b] transition-colors cursor-pointer"
                >
                  <i className={`${showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} text-sm`} aria-hidden="true" />
                </button>
              </div>
              {passwordError && (
                <p id="password-error" className="mt-1 text-xs text-red-500" role="alert">{passwordError}</p>
              )}
            </div>

            {/* Forgot password */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                data-nav-index="2"
                className="text-xs text-[#4f46e5] hover:text-indigo-700 font-medium cursor-pointer transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              data-nav-index="3"
              className="w-full h-10 rounded-lg bg-[#4f46e5] text-white text-sm font-semibold
                hover:bg-indigo-700 transition-colors
                disabled:opacity-60 disabled:cursor-not-allowed
                cursor-pointer flex items-center justify-center gap-2 mt-2 whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-base" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                <>
                  <i className="ri-login-box-line text-base" aria-hidden="true" />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 pt-5 border-t border-[#e2e8f0]">
            <p className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-3 text-center">
              Demo Credentials
            </p>
            <div className="space-y-2">
              {DEMO_CREDENTIALS.map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => { setEmail(cred.email); setPassword(cred.password); clearError(); setSubmitted(false); }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg
                    bg-[#f8fafc] hover:bg-indigo-50
                    border border-[#e2e8f0] hover:border-[#4f46e5]/30
                    transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#4f46e5] group-hover:text-indigo-700">
                      {cred.label}
                    </span>
                    <span className="text-xs text-[#64748b]">{cred.email}</span>
                  </div>
                  <i className="ri-arrow-right-line text-[#94a3b8] group-hover:text-[#4f46e5] text-sm" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-5">
          InvenPro ERP &copy; 2026 — Keyboard-first. GST-ready.
        </p>
      </div>
    </div>
  );
}