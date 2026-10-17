import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface EmptyStateProps {
  title: ReactNode;
  text?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, text, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-4 py-12 text-center',
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-line-soft text-muted">
        {icon ?? <Inbox className="size-6" aria-hidden="true" />}
      </div>
      <div className="max-w-sm">
        <p className="text-h2">{title}</p>
        {text ? <p className="mt-1 text-body text-muted">{text}</p> : null}
      </div>
      {action}
    </div>
  );
}
