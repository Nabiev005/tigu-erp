import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../lib/cn';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'xl';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-surface hover:bg-primary-dark',
  secondary: 'border border-line bg-surface text-ink hover:bg-line-soft',
  success: 'bg-success text-surface hover:bg-success-text',
  danger: 'bg-danger text-surface hover:bg-danger-text',
  ghost: 'text-ink hover:bg-line-soft',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-control-sm px-3 text-body',
  md: 'h-control px-4 text-body',
  xl: 'h-control-xl px-6 text-worker rounded-phone-card',
};

/** Class string for elements styled as buttons (e.g. router links). */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
} = {}): string {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-control font-semibold whitespace-nowrap transition-colors select-none',
    'disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    className,
  );
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant,
    size,
    loading = false,
    fullWidth,
    icon,
    className,
    disabled,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
});
