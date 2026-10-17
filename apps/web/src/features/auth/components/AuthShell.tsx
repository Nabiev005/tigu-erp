import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { paths } from '../../../shared/config/routes';
import { LanguageSwitcher, Logo } from '../../../shared/ui';

/** Centered card used by login and PIN screens (no app layout, spec §9). */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-paper">
      <header className="flex items-center justify-between px-4 py-4 sm:px-8">
        <Link to={paths.home}>
          <Logo />
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-4 pb-12 sm:items-center sm:pt-0">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
