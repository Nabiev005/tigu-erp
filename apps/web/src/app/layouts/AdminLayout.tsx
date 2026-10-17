import { LogOut, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth, useCurrentUser } from '../../features/auth';
import { ADMIN_NAV, isStage2Locked, navFor } from '../../shared/config/roles';
import { paths } from '../../shared/config/routes';
import { cn } from '../../shared/lib/cn';
import { LanguageSwitcher, Logo } from '../../shared/ui';

/** 220px dark sidebar; below 900px it becomes an overlay behind a burger button (spec §10). */
export function AdminLayout() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { signOut } = useAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const items = navFor(ADMIN_NAV, user.role);

  return (
    <div className="min-h-dvh nav:pl-sidebar">
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-surface px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t('common.skipToContent')}
      </a>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-paper px-4 nav:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={t('common.openMenu')}
          aria-expanded={open}
          aria-controls="admin-sidebar"
          className="flex size-control items-center justify-center rounded-control hover:bg-line-soft"
        >
          <Menu className="size-5" />
        </button>
        <Link to={paths.admin}>
          <Logo />
        </Link>
      </header>

      {open ? (
        <div
          className="fixed inset-0 z-40 bg-ink/50 nav:hidden"
          aria-hidden="true"
          onClick={() => setOpen(false)}
        />
      ) : null}

      <aside
        id="admin-sidebar"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-sidebar flex-col bg-ink text-surface transition-transform',
          open ? 'translate-x-0' : '-translate-x-full nav:translate-x-0',
        )}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <Link to={paths.admin}>
            <Logo tone="light" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('common.closeMenu')}
            className="flex size-control items-center justify-center rounded-control hover:bg-ink-2 nav:hidden"
          >
            <X className="size-5" />
          </button>
        </div>
        <p className="truncate px-4 pb-3 text-caption text-line">{user.tenant.name}</p>

        <nav className="flex-1 overflow-y-auto px-2" aria-label={t('common.menu')}>
          <ul className="flex flex-col gap-0.5">
            {items.map(({ section, to, icon: Icon, end }) => {
              const locked = isStage2Locked(section);
              const content = (
                <>
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span className="flex-1 truncate">{t(`nav.${section}`)}</span>
                  {locked ? (
                    <span className="rounded-full bg-ink-2 px-1.5 text-micro text-line">
                      {t('common.stage', { stage: 2 })}
                    </span>
                  ) : null}
                </>
              );
              return (
                <li key={section}>
                  {locked ? (
                    <span
                      aria-disabled="true"
                      className="flex h-control items-center gap-3 rounded-control px-3 text-body text-muted"
                    >
                      {content}
                    </span>
                  ) : (
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        cn(
                          'flex h-control items-center gap-3 rounded-control px-3 text-body transition-colors',
                          isActive
                            ? 'bg-ink-2 font-semibold text-surface'
                            : 'text-line hover:bg-ink-2 hover:text-surface',
                        )
                      }
                    >
                      {content}
                    </NavLink>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex flex-col gap-3 border-t border-ink-2 p-4">
          <div className="min-w-0">
            <p className="truncate text-body font-semibold">{user.fullName}</p>
            <p className="text-caption text-line">{t(`roles.${user.role}`)}</p>
          </div>
          <div className="flex items-center justify-between gap-2">
            <LanguageSwitcher tone="dark" />
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label={t('common.logout')}
              title={t('common.logout')}
              className="flex size-control items-center justify-center rounded-control text-line hover:bg-ink-2 hover:text-surface"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <main id="main" className="mx-auto w-full max-w-content p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
