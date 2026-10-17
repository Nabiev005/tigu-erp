import { AlertTriangle, CheckCircle2, Info, XCircle, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export type AlertTone = 'danger' | 'warning' | 'success' | 'info';

const TONES: Record<AlertTone, { box: string; icon: LucideIcon }> = {
  danger: { box: 'border-danger bg-danger-soft text-danger-text', icon: XCircle },
  warning: { box: 'border-warning bg-warning-soft text-warning-text', icon: AlertTriangle },
  success: { box: 'border-success bg-success-soft text-success-text', icon: CheckCircle2 },
  info: { box: 'border-primary-ring bg-primary-soft text-primary-dark', icon: Info },
};

export interface AlertProps {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function Alert({ tone = 'info', title, children, action, className }: AlertProps) {
  const { box, icon: Icon } = TONES[tone];
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex gap-3 rounded-card border border-l-4 p-3 sm:p-4', box, className)}
    >
      <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn('text-body', title && 'mt-0.5')}>{children}</div> : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  );
}
