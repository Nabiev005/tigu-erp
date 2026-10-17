import { LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router-dom';
import { useAuth, useCurrentUser } from '../../features/auth';
import { paths } from '../../shared/config/routes';
import { LanguageSwitcher, Logo } from '../../shared/ui';

/** Client portal shell (stage 2): header + content only. */
export function PortalLayout() {
  const { t } = useTranslation();
  const user = useCurrentUser();
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-4 sm:px-8">
          <Link to={paths.portal}>
            <Logo />
          </Link>
          <div className="flex items-center gap-2">
            <span className="hidden truncate text-body text-muted sm:inline">{user.fullName}</span>
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => void signOut()}
              aria-label={t('common.logout')}
              className="flex size-control items-center justify-center rounded-control text-muted hover:bg-line-soft"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-content flex-1 p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}
