import type { HTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export type BadgeTone = 'neutral' | 'soft' | 'primary' | 'success' | 'warning' | 'danger' | 'dark';

const TONES: Record<BadgeTone, string> = {
  neutral: 'border border-line bg-surface text-body-2',
  soft: 'bg-line-soft text-body-2',
  primary: 'bg-primary-soft text-primary-dark',
  success: 'bg-success-soft text-success-text',
  warning: 'bg-warning-soft text-warning-text',
  danger: 'bg-danger-soft text-danger-text',
  dark: 'bg-ink text-surface',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'neutral', className, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-caption font-medium whitespace-nowrap',
        TONES[tone],
        className,
      )}
      {...rest}
    />
  );
}
