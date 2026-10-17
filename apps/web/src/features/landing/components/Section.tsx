import type { ReactNode } from 'react';
import { cn } from '../../../shared/lib/cn';

export function Section({
  id,
  title,
  children,
  tone = 'paper',
  className,
}: {
  id?: string;
  title?: ReactNode;
  children: ReactNode;
  tone?: 'paper' | 'surface' | 'ink';
  className?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-16 px-4 py-16 sm:px-8 sm:py-24',
        tone === 'surface' && 'border-y border-line bg-surface',
        tone === 'ink' && 'bg-ink text-surface',
        className,
      )}
    >
      <div className="mx-auto max-w-content">
        {title ? <h2 className="mb-8 text-h1 sm:mb-12 sm:text-section">{title}</h2> : null}
        {children}
      </div>
    </section>
  );
}
