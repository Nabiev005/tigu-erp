import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, error, id, className, ...rest },
  ref,
) {
  const autoId = useId();
  const controlId = id ?? autoId;
  const errorId = error ? `${controlId}-error` : undefined;
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={controlId} className="flex min-h-control items-start gap-3 py-2">
        <input
          ref={ref}
          id={controlId}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={errorId}
          className="mt-0.5 size-5 shrink-0 rounded accent-primary"
          {...rest}
        />
        <span className="text-body text-body-2">{label}</span>
      </label>
      {error ? (
        <p id={errorId} className="text-caption text-danger-text">
          {error}
        </p>
      ) : null}
    </div>
  );
});
