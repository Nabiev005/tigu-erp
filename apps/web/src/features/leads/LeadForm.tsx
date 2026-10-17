import { zodResolver } from '@hookform/resolvers/zod';
import { LeadRequestSchema } from '@tigu/shared';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import type { z } from 'zod';
import { api } from '../../shared/api/client';
import { useErrorMessage, useFieldError } from '../../shared/i18n/useErrorMessage';
import { Alert, Button, Input, PhoneInput } from '../../shared/ui';

type LeadInput = z.input<typeof LeadRequestSchema>;
type LeadOutput = z.output<typeof LeadRequestSchema>;

/** Demo request from the landing page: POST /leads (admin gets a Telegram notification). */
export function LeadForm() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const fieldError = useFieldError();
  const mutation = useMutation({
    mutationFn: (body: LeadOutput) => api.post<{ id: string }>('/leads', body),
  });
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadInput, unknown, LeadOutput>({
    resolver: zodResolver(LeadRequestSchema),
    defaultValues: { name: '', phone: '' },
  });

  if (mutation.isSuccess) {
    return <Alert tone="success">{t('landing.lead.success')}</Alert>;
  }

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => mutation.mutate(values))}
      className="flex flex-col gap-4"
    >
      {mutation.isError ? <Alert tone="danger">{errorMessage(mutation.error)}</Alert> : null}
      <Input
        label={t('landing.lead.name')}
        autoComplete="name"
        error={fieldError(errors.name?.message)}
        {...register('name')}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field }) => (
          <PhoneInput
            label={t('landing.lead.phone')}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
            error={fieldError(errors.phone?.message)}
          />
        )}
      />
      <Input
        label={t('landing.lead.employeesCount')}
        type="number"
        inputMode="numeric"
        min={1}
        error={fieldError(errors.employeesCount?.message)}
        {...register('employeesCount', { valueAsNumber: true })}
      />
      <Button type="submit" fullWidth loading={mutation.isPending}>
        {t('landing.lead.submit')}
      </Button>
    </form>
  );
}
