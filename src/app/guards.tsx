import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth, type StaffRole } from '@/features/auth/context';

function Splash() {
  return <div className="min-h-dvh" aria-busy="true" aria-label="завантаження" />;
}

/** Layout route: renders children only for signed-in users; otherwise sends them to /login and back. */
export function RequireAuth() {
  const auth = useAuth();
  const location = useLocation();
  if (auth.status === 'loading') return <Splash />;
  if (auth.status === 'signedOut') {
    const next = location.pathname + location.search;
    return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
  }
  return <Outlet />;
}

/** Shows children only for the given role; others are sent to the menu. Waits for the profile. */
export function RequireRole({ allow, children }: { allow: StaffRole; children: ReactNode }) {
  const auth = useAuth();
  if (auth.status !== 'signedIn') return null;
  if (!auth.profile) return <Splash />;
  if (auth.profile.role !== allow) return <Navigate to="/menu" replace />;
  return <>{children}</>;
}
