import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';

export function Logo({
  tone = 'dark',
  className,
}: {
  tone?: 'dark' | 'light';
  className?: string;
}) {
  const { t } = useTranslation();
  return (
    <span className={cn('inline-flex items-center gap-2 font-bold', className)}>
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
        <rect
          width="32"
          height="32"
          rx="8"
          className={tone === 'dark' ? 'fill-ink' : 'fill-surface'}
        />
        <path
          d="M9 10h14M16 10v13"
          strokeWidth="3"
          strokeLinecap="round"
          className={tone === 'dark' ? 'stroke-paper' : 'stroke-ink'}
        />
      </svg>
      <span className={cn('text-h2 font-bold', tone === 'dark' ? 'text-ink' : 'text-surface')}>
        {t('app.name')}
      </span>
    </span>
  );
}
