import { Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { paths } from '../../shared/config/routes';
import { cn } from '../../shared/lib/cn';
import { LanguageSwitcher, Logo, buttonClasses } from '../../shared/ui';

const NAV = [
  { key: 'home', hash: '' },
  { key: 'features', hash: 'features' },
  { key: 'how', hash: 'how' },
  { key: 'pricing', hash: 'pricing' },
  { key: 'about', hash: 'about' },
  { key: 'contact', hash: 'contact' },
] as const;

export function PublicLayout() {
  const { t } = useTranslation();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu on navigation; scroll to #anchors (react-router does not).
  useEffect(() => {
    setMenuOpen(false);
    if (location.hash) {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [location.pathname, location.hash]);

  const navLinks = (className: string) =>
    NAV.map((item) => (
      <Link
        key={item.key}
        to={item.hash ? `${paths.home}#${item.hash}` : paths.home}
        className={className}
      >
        {t(`landing.nav.${item.key}`)}
      </Link>
    ));

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-control bg-surface px-4 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        {t('common.skipToContent')}
      </a>
      <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-content items-center gap-6 px-4 sm:px-8">
          <Link to={paths.home} aria-label={t('app.name')}>
            <Logo />
          </Link>
          <nav className="hidden flex-1 items-center gap-5 lg:flex" aria-label={t('common.menu')}>
            {navLinks('text-body font-medium text-body-2 hover:text-ink')}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <Link
              to={paths.login}
              className={buttonClasses({
                variant: 'ghost',
                size: 'sm',
                className: 'hidden sm:inline-flex',
              })}
            >
              {t('landing.nav.login')}
            </Link>
            <Link
              to={paths.register}
              className={buttonClasses({ size: 'sm', className: 'hidden sm:inline-flex' })}
            >
              {t('landing.nav.register')}
            </Link>
            <button
              type="button"
              className="flex size-control items-center justify-center rounded-control hover:bg-line-soft lg:hidden"
              aria-expanded={menuOpen}
              aria-controls="public-menu"
              aria-label={menuOpen ? t('common.closeMenu') : t('common.openMenu')}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
        <nav
          id="public-menu"
          aria-label={t('common.menu')}
          className={cn('border-t border-line bg-paper px-4 pb-4 lg:hidden', !menuOpen && 'hidden')}
        >
          <div className="flex flex-col">
            {navLinks(
              'flex min-h-control items-center border-b border-line-soft text-body font-medium',
            )}
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link to={paths.login} className={buttonClasses({ variant: 'secondary' })}>
              {t('landing.nav.login')}
            </Link>
            <Link to={paths.register} className={buttonClasses()}>
              {t('landing.nav.register')}
            </Link>
          </div>
        </nav>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-ink px-4 py-10 text-surface sm:px-8">
        <div className="mx-auto flex max-w-content flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <Logo tone="light" />
            <p className="mt-3 max-w-xs text-body opacity-70">{t('app.tagline')}</p>
          </div>
          <nav className="grid grid-cols-2 gap-x-8 gap-y-2" aria-label={t('common.menu')}>
            {navLinks('text-body opacity-80 hover:opacity-100')}
          </nav>
          <div className="text-body opacity-70">
            <p>{t('landing.footer.contacts')}</p>
            <p className="mt-2">{t('landing.footer.rights', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
