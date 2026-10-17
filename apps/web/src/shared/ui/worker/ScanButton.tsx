import { QrCode } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';

/** 240px round "Scan" button with a 14px ring — the sewer's main action (spec §9, 3.1). */
export function ScanButton({ className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      className={cn(
        'flex size-scan flex-col items-center justify-center gap-3 rounded-full bg-primary text-surface ring-14 ring-primary-ring',
        'transition-transform hover:bg-primary-dark active:scale-95 disabled:opacity-50',
        className,
      )}
      {...rest}
    >
      <QrCode className="size-16" strokeWidth={1.5} aria-hidden="true" />
      <span className="text-worker-title">{t('ui.scanButton')}</span>
    </button>
  );
}
