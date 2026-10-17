import { useId, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface FieldRenderProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
}

export interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  id?: string;
  className?: string;
  /** Visually hide the label (it stays available to screen readers). */
  hideLabel?: boolean;
  children: (props: FieldRenderProps) => ReactNode;
}

/** Label + control + hint/error wiring shared by every form control. */
export function Field({ label, hint, error, id, className, hideLabel, children }: FieldProps) {
  const autoId = useId();
  const controlId = id ?? autoId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label
        htmlFor={controlId}
        className={cn('text-body font-medium text-body-2', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      {children({
        id: controlId,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
      })}
      {error ? (
        <p id={errorId} className="text-caption text-danger-text">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-caption text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export const controlClasses = (invalid: boolean, className?: string) =>
  cn(
    'h-control w-full rounded-control border bg-surface px-3 text-body text-ink placeholder:text-muted',
    'transition-colors outline-none focus:ring-1 focus:ring-inset',
    'disabled:cursor-not-allowed disabled:bg-line-soft disabled:text-muted',
    invalid
      ? 'border-danger focus:border-danger focus:ring-danger'
      : 'border-line focus:border-primary focus:ring-primary',
    className,
  );
