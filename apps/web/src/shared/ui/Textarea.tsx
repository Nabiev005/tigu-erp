import { forwardRef, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { cn } from '../lib/cn';
import { Field, controlClasses } from './Field';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  hideLabel?: boolean;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, hideLabel, id, className, containerClassName, rows = 4, ...rest },
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
        <textarea
          ref={ref}
          rows={rows}
          {...fieldProps}
          {...rest}
          className={controlClasses(Boolean(error), cn('h-auto py-2', className))}
        />
      )}
    </Field>
  );
});
