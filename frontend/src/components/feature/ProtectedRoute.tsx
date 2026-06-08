import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
  requirePermission?: () => boolean; // 🔥 flexible
}

export default function ProtectedRoute({
  children,
  requiredRoles,
  requirePermission,
}: ProtectedRouteProps) {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  // ⏳ Wait for auth
  if (loading) return <div>Loading...</div>;

  // ❌ Not logged in
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const role = user.role.toUpperCase().replace(/\s+/g, "_");
  const isGuard = role === "SECURITY_GUARD";
  const isGuardRoute = location.pathname.startsWith("/guard");

  // 🔒 Guard isolation
  if (isGuard && !isGuardRoute) {
    return <Navigate to="/guard/dashboard" replace />;
  }

  if (!isGuard && isGuardRoute) {
    return <Navigate to="/" replace />;
  }

  // 🎭 Role check (optional)
  if (requiredRoles?.length) {
    const normalized = requiredRoles.map(r =>
      r.toUpperCase().replace(/\s+/g, "_")
    );

    if (!normalized.includes(role)) {
      return <Navigate to={isGuard ? "/guard/dashboard" : "/"} replace />;
    }
  }

  // 🔑 Permission check (optional + flexible)
  if (requirePermission && !requirePermission()) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// import { ReactNode } from 'react';
// import { Navigate, useLocation, useNavigate } from 'react-router-dom';
// // import { useAuthStore } from '@/stores/authStore';
// // import type { UserRole } from '@/stores/authStore';
// import { useAuth } from '@/contexts/AuthContext'; 

// import { useAuthStore } from '@/stores/authStore';


// interface ProtectedRouteProps {
//   children: ReactNode;
//   requiredRoles?: string[];
//   // requiredRoles?: UserRole[];
//   // requiredPermission?: string;
// }

// // function AccessDenied() {
// //   const navigate = useNavigate();
// //   return (
// //     <div className="flex items-center justify-center min-h-screen bg-[#f8fafc]">
// //       <div className="text-center max-w-md">
// //         <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
// //           <i className="ri-lock-line text-3xl text-red-500" />
// //         </div>
// //         <h2 className="text-xl font-bold text-[#1e293b] mb-2">Access Denied</h2>
// //         <p className="text-sm text-[#64748b] mb-6">
// //           You don't have permission to access this page. Contact your administrator to request access.
// //         </p>
// //         <div className="flex items-center justify-center gap-3">
// //           <button
// //             onClick={() => navigate(-1)}
// //             className="flex items-center gap-2 h-9 px-4 rounded-lg border border-[#e2e8f0] text-sm text-[#1e293b] font-medium hover:bg-slate-50 transition-colors cursor-pointer whitespace-nowrap"
// //           >
// //             <i className="ri-arrow-left-line" />Go Back
// //           </button>
// //           <button
// //             onClick={() => navigate('/')}
// //             className="flex items-center gap-2 h-9 px-4 rounded-lg bg-[#4f46e5] text-white text-sm font-medium hover:bg-indigo-700 transition-colors cursor-pointer whitespace-nowrap"
// //           >
// //             <i className="ri-home-line" />Dashboard
// //           </button>
// //         </div>
// //       </div>
// //     </div>
// //   );
// // }

// // export default function ProtectedRoute({ children, requiredRoles, }: ProtectedRouteProps) {
//  //  const { isAuthenticated, user, loading } = useAuth();
//  //  const location = useLocation();

//  //  if (!isAuthenticated) {
// //     return <Navigate to="/login" state={{ from: location }} replace />;
//  //  }

// //   // Role check
// //   if (requiredRoles && user && !requiredRoles.includes(user.role)) {
// //     return <AccessDenied />;
// //   }

// //   // Permission check (for END_USER)
// //   if (requiredPermission && user?.role === 'END_USER') {
// //     const hasPermission = user.permissions?.includes(requiredPermission) ?? false;
// //     if (!hasPermission) return <AccessDenied />;
// //   }

// //   return <>{children}</>;
// // }

// // export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
// //   const { isAuthenticated, user, loading } = useAuth();
// //   const location = useLocation();
// //   const role = user.role?.toUpperCase().replace(/\s+/g, '_') ?? '';
// //   const isGuard = role === 'SECURITY_GUARD';
// //   const isGuardRoute = location.pathname.startsWith('/guard');

// //   // ⏳ Wait until auth check completes
// //   if (loading) return <div>Loading...</div>;

// //   // ❌ Not logged in → redirect to login
// //   if (!isAuthenticated) {
// //     return <Navigate to="/login" state={{ from: location }} replace />;
// //   }

  
// //   // ── SECURITY_GUARD trying to access non-guard routes → guard dashboard ──
// //   if (isGuard && !isGuardRoute) {
// //     return <Navigate to="/guard/dashboard" replace />;
// //   }
 
// //   // ── Non-guard user trying to access guard routes → main dashboard ───────
// //   if (!isGuard && isGuardRoute) {
// //     return <Navigate to="/" replace />;
// //   }

// // // ── Role-based access check ─────────────────────────────────────────────
// //   if (requiredRoles && requiredRoles.length > 0) {
// //     const normalised = requiredRoles.map((r) => r.toUpperCase().replace(/\s+/g, '_'));
// //     if (!normalised.includes(role)) {
// //       // Redirect guards to their dashboard, others to main dashboard
// //       return <Navigate to={isGuard ? '/guard/dashboard' : '/'} replace />;
// //     }
// //   }
 
// //   // ✅ Logged in → allow access
// //   return <>{children}</>;

// // }
// export default function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
//   const { isAuthenticated, user, loading } = useAuth();
//   const location = useLocation();

//   // ✅ WAIT until auth is fully ready
//   if (loading) return <div>Loading...</div>;

//   // ❌ ensure user exists before anything else
//   if (!isAuthenticated || !user) {
//     return <Navigate to="/login" state={{ from: location }} replace />;
//   }

//   const role = user.role.toUpperCase().replace(/\s+/g, '_');
//   const isGuard = role === 'SECURITY_GUARD';
//   const isGuardRoute = location.pathname.startsWith('/guard');

//   if (isGuard && !isGuardRoute) {
//     return <Navigate to="/guard/dashboard" replace />;
//   }

//   if (!isGuard && isGuardRoute) {
//     return <Navigate to="/" replace />;
//   }

//   if (requiredRoles?.length) {
//     const normalized = requiredRoles.map(r =>
//       r.toUpperCase().replace(/\s+/g, '_')
//     );

//     if (!normalized.includes(role)) {
//       return <Navigate to={isGuard ? '/guard/dashboard' : '/'} replace />;
//     }
//   }

//   return <>{children}</>;
// }
