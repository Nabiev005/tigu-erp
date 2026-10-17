import { Eye, EyeOff } from 'lucide-react';
import { forwardRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/cn';
import { Field, controlClasses } from './Field';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  hideLabel?: boolean;
  /** Content shown inside the field on the left (e.g. "+996"). */
  prefix?: ReactNode;
  /** Content shown inside the field on the right (e.g. a toggle button). */
  suffix?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, hideLabel, prefix, suffix, id, className, containerClassName, ...rest },
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
        <div className="relative flex items-center">
          {prefix ? (
            <span className="pointer-events-none absolute left-3 text-body text-muted num">
              {prefix}
            </span>
          ) : null}
          <input
            ref={ref}
            {...fieldProps}
            {...rest}
            className={controlClasses(
              Boolean(error),
              cn(prefix ? 'pl-14' : undefined, suffix ? 'pr-12' : undefined, className),
            )}
          />
          {suffix ? <span className="absolute right-1 flex items-center">{suffix}</span> : null}
        </div>
      )}
    </Field>
  );
});

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type' | 'suffix'>>(
  function PasswordInput(props, ref) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);
    return (
      <Input
        ref={ref}
        type={visible ? 'text' : 'password'}
        autoComplete="current-password"
        {...props}
        suffix={
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="flex size-control-sm items-center justify-center rounded-control text-muted hover:bg-line-soft"
            aria-label={visible ? t('common.hidePassword') : t('common.showPassword')}
            aria-pressed={visible}
          >
            {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        }
      />
    );
  },
);

const KG_PREFIX = '+996';

/** Kyrgyz phone input: shows "+996" and stores E.164 (`+996555123456`). */
export const PhoneInput = forwardRef<
  HTMLInputElement,
  Omit<InputProps, 'value' | 'onChange' | 'prefix' | 'type'> & {
    value: string;
    onChange: (value: string) => void;
  }
>(function PhoneInput({ value, onChange, ...rest }, ref) {
  const local = value.startsWith(KG_PREFIX) ? value.slice(KG_PREFIX.length) : '';
  const display = local.replace(
    /(\d{3})(\d{0,3})(\d{0,3})/,
    (_m, a: string, b: string, c: string) => [a, b, c].filter(Boolean).join(' '),
  );
  return (
    <Input
      ref={ref}
      type="tel"
      inputMode="numeric"
      autoComplete="tel-national"
      placeholder="555 123 456"
      {...rest}
      prefix={KG_PREFIX}
      value={display}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
        onChange(digits ? `${KG_PREFIX}${digits}` : '');
      }}
    />
  );
});

/** One-time code input (2FA / OTP): one field, numeric keyboard, SMS autofill. */
export const CodeInput = forwardRef<
  HTMLInputElement,
  Omit<InputProps, 'type'> & { length?: number }
>(function CodeInput({ length = 6, className, onChange, ...rest }, ref) {
  return (
    <Input
      ref={ref}
      type="text"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={length}
      placeholder={'•'.repeat(length)}
      className={cn('h-touch text-center text-worker-title tracking-[0.4em] num', className)}
      onChange={(e) => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, length);
        onChange?.(e);
      }}
      {...rest}
    />
  );
});
