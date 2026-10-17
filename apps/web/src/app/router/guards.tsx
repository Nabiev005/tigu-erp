import { ROLE_HOME, canAccessSection, type Role, type Section } from '@tigu/shared';
import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { homeFor, useAuth } from '../../features/auth';
import { firstAdminPath } from '../../shared/config/roles';
import { paths } from '../../shared/config/routes';
import { Spinner } from '../../shared/ui';

export function FullScreenLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-muted">
      <Spinner className="size-6" />
    </div>
  );
}

/** Lets only signed-in users through; others go to /login and come back afterwards. */
export function RequireAuth({ children }: { children?: ReactNode }) {
  const { state } = useAuth();
  const location = useLocation();
  if (state.status === 'loading') return <FullScreenLoader />;
  if (state.status === 'anonymous') {
    return (
      <Navigate to={paths.login} replace state={{ from: location.pathname + location.search }} />
    );
  }
  return children ?? <Outlet />;
}

/** Where to send a role that may not open `section`. Never points back at a denied route. */
export function fallbackFor(role: Role, section: Section): string {
  const home = ROLE_HOME[role];
  // FOREMAN/ACCOUNTANT land on /admin but may not see the dashboard: use their first section.
  if (home === paths.admin || section === 'dashboard') return firstAdminPath(role) ?? home;
  return home;
}

/**
 * Lets through roles allowed to open `section` (permissions matrix in @tigu/shared).
 * UI convenience only — the API enforces the same matrix.
 */
export function RequireRole({ section, children }: { section: Section; children?: ReactNode }) {
  const { state } = useAuth();
  if (state.status !== 'authenticated') return null;
  if (!canAccessSection(state.user.role, section)) {
    return <Navigate to={fallbackFor(state.user.role, section)} replace />;
  }
  return children ?? <Outlet />;
}

/** Login/PIN screens: signed-in users go straight to their home screen. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { state } = useAuth();
  if (state.status === 'loading') return <FullScreenLoader />;
  if (state.status === 'authenticated') return <Navigate to={homeFor(state.user)} replace />;
  return children;
}
