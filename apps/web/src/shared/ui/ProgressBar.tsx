import { cn } from '../lib/cn';

export type ProgressTone = 'primary' | 'warning' | 'danger' | 'success';

const TONES: Record<ProgressTone, string> = {
  primary: 'bg-primary',
  warning: 'bg-warning',
  danger: 'bg-danger',
  success: 'bg-success',
};

export interface ProgressBarProps {
  /** 0–100 */
  value: number;
  tone?: ProgressTone;
  label: string;
  showValue?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function ProgressBar({
  value,
  tone = 'primary',
  label,
  showValue = false,
  size = 'sm',
  className,
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={clamped}
        className={cn(
          'flex-1 overflow-hidden rounded-full bg-line-soft',
          size === 'sm' ? 'h-1.5' : 'h-2.5',
        )}
      >
        <div
          className={cn('h-full rounded-full transition-[width]', TONES[tone])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showValue ? <span className="w-10 text-right text-caption num">{clamped}%</span> : null}
    </div>
  );
}
