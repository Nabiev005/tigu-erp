import { STAGE2_SECTIONS, canAccessSection, type Role, type Section } from '@tigu/shared';
import {
  BarChart3,
  ClipboardList,
  Factory,
  FileSpreadsheet,
  History,
  LayoutDashboard,
  type LucideIcon,
  QrCode,
  Scissors,
  Settings,
  ShieldCheck,
  Shirt,
  Wallet,
  Warehouse,
} from 'lucide-react';
import { env } from './env';
import { paths } from './routes';

export interface NavItem {
  section: Section;
  to: string;
  icon: LucideIcon;
  /** Index route: active only on exact match. */
  end?: boolean;
}

export const ADMIN_NAV: readonly NavItem[] = [
  { section: 'dashboard', to: paths.admin, icon: LayoutDashboard, end: true },
  { section: 'orders', to: paths.orders, icon: ClipboardList },
  { section: 'models', to: paths.models, icon: Shirt },
  { section: 'cutting', to: paths.cutting, icon: Scissors },
  { section: 'production', to: paths.production, icon: Factory },
  { section: 'payroll', to: paths.payroll, icon: Wallet },
  { section: 'reports', to: paths.reports, icon: BarChart3 },
  { section: 'warehouse', to: paths.warehouse, icon: Warehouse },
  { section: 'quality', to: paths.quality, icon: ShieldCheck },
  { section: 'settings', to: paths.settings, icon: Settings },
];

export const WORKER_NAV: readonly NavItem[] = [
  { section: 'scan', to: paths.scan, icon: QrCode },
  { section: 'earnings', to: paths.earnings, icon: FileSpreadsheet },
  { section: 'history', to: paths.history, icon: History },
];

export function isStage2Locked(section: Section): boolean {
  return !env.features.stage2 && STAGE2_SECTIONS.includes(section);
}

export function navFor(items: readonly NavItem[], role: Role): NavItem[] {
  return items.filter((item) => canAccessSection(role, item.section));
}

/** First admin section a role may open — used when /admin itself is not allowed. */
export function firstAdminPath(role: Role): string | undefined {
  return navFor(ADMIN_NAV, role).find((item) => !isStage2Locked(item.section))?.to;
}
