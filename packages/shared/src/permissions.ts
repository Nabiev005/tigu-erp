import { z } from 'zod';
import type { Role } from './enums';

/** Per-user grants on top of the role (User.permissions JSON). */
export const PermissionsSchema = z.object({
  canSeePrices: z.boolean().optional(),
  canSeeCost: z.boolean().optional(),
});
export type Permissions = z.infer<typeof PermissionsSchema>;
export type Permission = keyof Permissions;

/** Application sections; each maps to a route group and a sidebar/bottom-nav item. */
export const SECTIONS = [
  'dashboard',
  'orders',
  'ordersCreate',
  'models',
  'cutting',
  'production',
  'payroll',
  'reports',
  'settings',
  'warehouse',
  'quality',
  'scan',
  'earnings',
  'history',
  'portal',
] as const;
export type Section = (typeof SECTIONS)[number];

/**
 * Role → section access matrix (spec §5, §9). Single source of truth for web and api.
 * OWNER sees every admin section (spec §5: "Баары").
 */
export const SECTION_ACCESS: Record<Section, readonly Role[]> = {
  dashboard: ['OWNER', 'TECHNOLOGIST'],
  orders: ['OWNER', 'TECHNOLOGIST', 'FOREMAN'],
  ordersCreate: ['OWNER', 'TECHNOLOGIST'],
  models: ['OWNER', 'TECHNOLOGIST'],
  cutting: ['OWNER', 'TECHNOLOGIST', 'CUTTER'],
  production: ['OWNER', 'TECHNOLOGIST', 'FOREMAN'],
  payroll: ['OWNER', 'ACCOUNTANT'],
  reports: ['OWNER', 'ACCOUNTANT'],
  settings: ['OWNER'],
  warehouse: ['OWNER', 'STOREKEEPER'],
  quality: ['OWNER', 'TECHNOLOGIST', 'FOREMAN'],
  scan: ['SEWER', 'FOREMAN'],
  earnings: ['SEWER'],
  history: ['SEWER'],
  portal: ['CLIENT'],
};

/** Sections that belong to stage 2 (shown greyed out or hidden behind a feature flag). */
export const STAGE2_SECTIONS: readonly Section[] = ['warehouse', 'quality', 'portal'];

export function canAccessSection(role: Role, section: Section): boolean {
  return SECTION_ACCESS[section].includes(role);
}

/** OWNER implicitly holds every permission; others need an explicit grant. */
export function hasPermission(
  user: { role: Role; permissions: Permissions },
  permission: Permission,
): boolean {
  return user.role === 'OWNER' || user.permissions[permission] === true;
}

/** Where a user lands after login (spec §9). */
export const ROLE_HOME: Record<Role, string> = {
  OWNER: '/admin',
  TECHNOLOGIST: '/admin',
  FOREMAN: '/admin',
  CUTTER: '/admin/cutting',
  SEWER: '/w/scan',
  STOREKEEPER: '/admin/warehouse',
  ACCOUNTANT: '/admin',
  CLIENT: '/portal',
};
