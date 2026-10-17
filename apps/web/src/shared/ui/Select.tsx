import { ChevronDown } from 'lucide-react';
import { forwardRef, type ReactNode, type SelectHTMLAttributes } from 'react';
import { cn } from '../lib/cn';
import { Field, controlClasses } from './Field';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: ReactNode;
  options: readonly SelectOption[];
  hint?: ReactNode;
  error?: string;
  hideLabel?: boolean;
  placeholder?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    options,
    hint,
    error,
    hideLabel,
    placeholder,
    id,
    className,
    containerClassName,
    ...rest
  },
  ref,
) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      id={id}
      hideLabel={hideLabel}
      className={containerClassName}
    >
      {(fieldProps) => (
        <div className="relative">
          <select
            ref={ref}
            {...fieldProps}
            {...rest}
            className={controlClasses(Boolean(error), cn('appearance-none pr-10', className))}
          >
            {placeholder ? (
              <option value="" disabled>
                {placeholder}
              </option>
            ) : null}
            {options.map((o) => (
              <option key={o.value} value={o.value} disabled={o.disabled}>
                {o.label}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
        </div>
      )}
    </Field>
  );
});
