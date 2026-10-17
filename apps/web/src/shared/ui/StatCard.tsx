import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type StatCardTone = 'default' | 'danger' | 'dark';

const TONES: Record<StatCardTone, string> = {
  default: 'border-line bg-surface text-ink',
  danger: 'border-danger bg-danger-soft text-danger-text',
  dark: 'border-ink bg-ink text-surface',
};

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: StatCardTone;
  className?: string;
}

export function StatCard({ label, value, hint, icon, tone = 'default', className }: StatCardProps) {
  return (
    <div className={cn('rounded-card border p-4 shadow-card', TONES[tone], className)}>
      <div className="flex items-start justify-between gap-2">
        <p className={cn('text-caption', tone === 'default' ? 'text-muted' : 'opacity-80')}>
          {label}
        </p>
        {icon ? <span className="opacity-70">{icon}</span> : null}
      </div>
      <p className="mt-2 text-h1 num">{value}</p>
      {hint ? (
        <p className={cn('mt-1 text-caption', tone === 'default' ? 'text-muted' : 'opacity-80')}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
