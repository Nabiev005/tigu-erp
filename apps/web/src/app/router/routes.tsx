import type { Section } from '@tigu/shared';
import { Navigate, type RouteObject } from 'react-router-dom';
import { LoginPage } from '../../pages/auth/LoginPage';
import { PinPage } from '../../pages/auth/PinPage';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { RouteErrorPage } from '../../pages/RouteErrorPage';
import { StagePlaceholderPage } from '../../pages/StagePlaceholderPage';
import { paths } from '../../shared/config/routes';
import { WorkerLayout } from '../layouts/WorkerLayout';
import { GuestOnly, RequireAuth, RequireRole } from './guards';

/** Screen not built yet: guarded route that shows which stage delivers it. */
function stage(section: Section, n: number): Pick<RouteObject, 'element'> {
  return {
    element: (
      <RequireRole section={section}>
        <StagePlaceholderPage section={section} stage={n} />
      </RequireRole>
    ),
  };
}

// Public site and admin are lazy so the sewer bundle stays small (spec §15).
const appRoutes: RouteObject[] = [
  {
    lazy: async () => ({ Component: (await import('../layouts/PublicLayout')).PublicLayout }),
    children: [
      {
        index: true,
        lazy: async () => ({
          Component: (await import('../../pages/public/LandingPage')).LandingPage,
        }),
      },
      {
        path: 'register',
        lazy: async () => ({
          Component: (await import('../../pages/public/RegisterPage')).RegisterPage,
        }),
      },
    ],
  },
  {
    path: 'login',
    element: (
      <GuestOnly>
        <LoginPage />
      </GuestOnly>
    ),
  },
  {
    path: 'pin',
    element: (
      <GuestOnly>
        <PinPage />
      </GuestOnly>
    ),
  },
  {
    path: 'admin',
    element: <RequireAuth />,
    children: [
      {
        lazy: async () => ({ Component: (await import('../layouts/AdminLayout')).AdminLayout }),
        children: [
          { index: true, ...stage('dashboard', 9) },
          { path: 'orders', ...stage('orders', 4) },
          { path: 'orders/new', ...stage('ordersCreate', 4) },
          { path: 'orders/:id', ...stage('orders', 4) },
          { path: 'models', ...stage('models', 3) },
          { path: 'models/:id', ...stage('models', 3) },
          { path: 'cutting', ...stage('cutting', 5) },
          { path: 'cutting/:id', ...stage('cutting', 5) },
          { path: 'production', ...stage('production', 7) },
          { path: 'payroll', ...stage('payroll', 8) },
          { path: 'payroll/:periodId', ...stage('payroll', 8) },
          { path: 'reports', ...stage('reports', 9) },
          { path: 'settings/*', ...stage('settings', 2) },
          { path: 'warehouse', ...stage('warehouse', 11) },
          { path: 'quality', ...stage('quality', 11) },
        ],
      },
    ],
  },
  {
    path: 'w',
    element: <RequireAuth />,
    children: [
      {
        element: <WorkerLayout />,
        children: [
          { index: true, element: <Navigate to={paths.scan} replace /> },
          { path: 'scan', ...stage('scan', 6) },
          { path: 'scan/:qrToken', ...stage('scan', 6) },
          { path: 'scan/:qrToken/done', ...stage('scan', 6) },
          { path: 'earnings', ...stage('earnings', 6) },
          { path: 'history', ...stage('history', 6) },
        ],
      },
    ],
  },
  {
    path: 'portal',
    element: <RequireAuth />,
    children: [
      {
        lazy: async () => ({ Component: (await import('../layouts/PortalLayout')).PortalLayout }),
        children: [
          { index: true, ...stage('portal', 11) },
          { path: 'orders/:id', ...stage('portal', 11) },
        ],
      },
    ],
  },
  ...(import.meta.env.DEV
    ? [
        {
          path: 'dev/ui',
          lazy: async () => ({ Component: (await import('../../pages/dev/UiKitPage')).UiKitPage }),
        },
      ]
    : []),
  { path: '*', element: <NotFoundPage /> },
];

export const routes: RouteObject[] = [{ errorElement: <RouteErrorPage />, children: appRoutes }];
