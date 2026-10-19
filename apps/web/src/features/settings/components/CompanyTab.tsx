import { zodResolver } from '@hookform/resolvers/zod';
import { TIMEZONES, TenantUpdateRequestSchema, type Tenant } from '@tigu/shared';
import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useErrorMessage, useFieldError } from '../../../shared/i18n/useErrorMessage';
import { cn } from '../../../shared/lib/cn';
import {
  Alert,
  Button,
  Card,
  ErrorState,
  Input,
  Select,
  Skeleton,
  useToast,
} from '../../../shared/ui';
import { useTenant, useUpdateTenant } from '../api/settingsApi';

const FormSchema = z.object({
  name: z.string().trim().min(2, 'validation.required').max(120),
  city: z.string().trim().max(80),
  timezone: z.enum(TIMEZONES),
  workDays: TenantUpdateRequestSchema.shape.workDays.unwrap(),
  shiftHours: z
    .number({ invalid_type_error: 'validation.shiftHours' })
    .int('validation.shiftHours')
    .min(1, 'validation.shiftHours')
    .max(24, 'validation.shiftHours'),
});
type FormValues = z.infer<typeof FormSchema>;

const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const;

function toForm(tenant: Tenant): FormValues {
  const timezone = (TIMEZONES as readonly string[]).includes(tenant.timezone)
    ? (tenant.timezone as FormValues['timezone'])
    : 'Asia/Bishkek';
  return {
    name: tenant.name,
    city: tenant.city ?? '',
    timezone,
    workDays: tenant.workDays,
    shiftHours: tenant.shiftHours,
  };
}

export function CompanyTab() {
  const tenant = useTenant();
  if (tenant.isPending) return <Skeleton className="h-96" />;
  if (tenant.isError)
    return <ErrorState error={tenant.error} onRetry={() => void tenant.refetch()} />;
  return <CompanyForm tenant={tenant.data} />;
}

function CompanyForm({ tenant }: { tenant: Tenant }) {
  const { t } = useTranslation();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const fieldError = useFieldError();
  const update = useUpdateTenant();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues: toForm(tenant) });

  useEffect(() => reset(toForm(tenant)), [tenant, reset]);

  const submit = (values: FormValues) =>
    update.mutate(
      { ...values, city: values.city || null, workDays: [...values.workDays].sort() },
      { onSuccess: () => toast.show({ tone: 'success', title: t('settings.company.saved') }) },
    );

  return (
    <Card>
      <form noValidate onSubmit={handleSubmit(submit)} className="flex max-w-2xl flex-col gap-5">
        {update.isError ? <Alert tone="danger">{errorMessage(update.error)}</Alert> : null}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label={t('settings.company.name')}
            error={fieldError(errors.name?.message)}
            {...register('name')}
          />
          <Input
            label={t('settings.company.city')}
            error={fieldError(errors.city?.message)}
            {...register('city')}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t('settings.company.timezone')}
            options={TIMEZONES.map((tz) => ({ value: tz, label: tz }))}
            {...register('timezone')}
          />
          <Input
            label={t('settings.company.shiftHours')}
            hint={t('settings.company.shiftHoursHint')}
            type="number"
            inputMode="numeric"
            min={1}
            max={24}
            error={fieldError(errors.shiftHours?.message)}
            {...register('shiftHours', { valueAsNumber: true })}
          />
        </div>

        <Controller
          control={control}
          name="workDays"
          render={({ field }) => (
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-body font-medium text-body-2">
                {t('settings.company.workDays')}
              </legend>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((day) => {
                  const checked = field.value.includes(day);
                  return (
                    <label
                      key={day}
                      className={cn(
                        'flex h-control cursor-pointer items-center rounded-control border px-3 text-body',
                        'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary',
                        checked
                          ? 'border-primary bg-primary-soft text-primary-dark'
                          : 'border-line bg-surface',
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() =>
                          field.onChange(
                            checked ? field.value.filter((d) => d !== day) : [...field.value, day],
                          )
                        }
                      />
                      {t(`settings.weekdays.${day}`)}
                    </label>
                  );
                })}
              </div>
              {errors.workDays ? (
                <p className="text-caption text-danger-text">
                  {fieldError(errors.workDays.message ?? errors.workDays.root?.message)}
                </p>
              ) : (
                <p className="text-caption text-muted">{t('settings.company.workDaysHint')}</p>
              )}
            </fieldset>
          )}
        />

        <dl className="grid gap-4 border-t border-line pt-4 text-body sm:grid-cols-2">
          <div>
            <dt className="text-caption text-muted">{t('settings.company.plan')}</dt>
            <dd className="font-medium">{tenant.plan}</dd>
          </div>
          <div>
            <dt className="text-caption text-muted">{t('settings.company.employees')}</dt>
            <dd className="num">{tenant.employeesCount ?? '—'}</dd>
          </div>
        </dl>

        <Button type="submit" className="self-start" disabled={!isDirty} loading={update.isPending}>
          {t('settings.company.save')}
        </Button>
      </form>
    </Card>
  );
}
