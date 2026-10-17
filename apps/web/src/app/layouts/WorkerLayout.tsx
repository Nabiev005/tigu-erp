import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth, useCurrentUser } from '../../features/auth';
import { WORKER_NAV, navFor } from '../../shared/config/roles';
import { cn } from '../../shared/lib/cn';
import { LanguageSwitcher } from '../../shared/ui';

/** Mobile-first shell for sewers: compact header, content, bottom navigation (spec §9, 3.x). */
export function WorkerLayout() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { signOut } = useAuth();
  const items = navFor(WORKER_NAV, user.role);

  return (
    <div className="flex min-h-dvh flex-col bg-paper text-worker">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-line bg-paper px-4">
        <p className="truncate font-semibold">{user.fullName}</p>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <button
            type="button"
            onClick={() => void signOut()}
            aria-label={t('common.logout')}
            className="flex size-touch items-center justify-center rounded-control text-muted hover:bg-line-soft"
          >
            <LogOut className="size-5" />
          </button>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-lg flex-1 px-4 pt-4 pb-28">
        <Outlet />
      </main>

      <nav
        aria-label={t('common.menu')}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]"
      >
        <ul
          className="mx-auto grid max-w-lg"
          style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
        >
          {items.map(({ section, to, icon: Icon }) => (
            <li key={section}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex min-h-control-xl flex-col items-center justify-center gap-1 text-caption font-medium',
                    isActive ? 'text-primary' : 'text-muted',
                  )
                }
              >
                <Icon className="size-6" aria-hidden="true" />
                {t(`nav.${section}`)}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
