import { zodResolver } from '@hookform/resolvers/zod';
import { CodeSchema } from '@tigu/shared';
import type { ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useFieldError } from '../../../shared/i18n/useErrorMessage';
import { Alert, Button, CodeInput } from '../../../shared/ui';

const FormSchema = z.object({ code: CodeSchema });
type FormValues = z.infer<typeof FormSchema>;

export interface CodeFormProps {
  label: string;
  submitLabel: string;
  onSubmit: (code: string) => Promise<void>;
  error?: string | null;
  footer?: ReactNode;
}

/** 6-digit code step shared by 2FA, OTP login and phone confirmation. */
export function CodeForm({ label, submitLabel, onSubmit, error, footer }: CodeFormProps) {
  const fieldError = useFieldError();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues: { code: '' } });

  return (
    <form
      noValidate
      onSubmit={handleSubmit(({ code }) => onSubmit(code))}
      className="flex flex-col gap-4"
    >
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <CodeInput
        label={label}
        autoFocus
        error={fieldError(errors.code?.message)}
        {...register('code')}
      />
      <Button type="submit" size="md" fullWidth loading={isSubmitting}>
        {submitLabel}
      </Button>
      {footer}
    </form>
  );
}
