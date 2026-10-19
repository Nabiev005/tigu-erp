import { zodResolver } from '@hookform/resolvers/zod';
import { BrigadeCreateRequestSchema } from '@tigu/shared';
import { Plus, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useErrorMessage, useFieldError } from '../../../shared/i18n/useErrorMessage';
import {
  Alert,
  Button,
  Card,
  CardHeader,
  EmptyState,
  ErrorState,
  Input,
  Select,
  Skeleton,
  useToast,
} from '../../../shared/ui';
import { useBrigades, useCreateBrigade, useUsersByRole } from '../api/settingsApi';

const FormSchema = z.object({
  name: BrigadeCreateRequestSchema.shape.name,
  foremanId: z.string(),
});
type FormValues = z.infer<typeof FormSchema>;

export function BrigadesPanel() {
  const { t } = useTranslation();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const fieldError = useFieldError();
  const brigades = useBrigades();
  const foremen = useUsersByRole('FOREMAN');
  const create = useCreateBrigade();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { name: '', foremanId: '' },
  });

  const foremanName = new Map((foremen.data?.items ?? []).map((u) => [u.id, u.fullName]));

  const submit = (values: FormValues) =>
    create.mutate(
      { name: values.name, foremanId: values.foremanId || null },
      {
        onSuccess: () => {
          reset();
          toast.show({ tone: 'success', title: t('settings.brigades.created') });
        },
      },
    );

  return (
    <Card>
      <CardHeader title={t('settings.brigades.title')} />
      {brigades.isPending ? (
        <Skeleton className="h-16" />
      ) : brigades.isError ? (
        <ErrorState error={brigades.error} onRetry={() => void brigades.refetch()} />
      ) : brigades.data.length === 0 ? (
        <EmptyState className="py-6" title={t('settings.brigades.empty')} />
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {brigades.data.map((b) => (
            <li
              key={b.id}
              className="flex items-center gap-3 rounded-control border border-line p-3"
            >
              <Users className="size-5 shrink-0 text-muted" aria-hidden="true" />
              <div className="min-w-0">
                <p className="truncate font-semibold">{b.name}</p>
                <p className="truncate text-caption text-muted">
                  {(b.foremanId && foremanName.get(b.foremanId)) ||
                    t('settings.brigades.noForeman')}{' '}
                  ·{' '}
                  <span className="num">
                    {t('settings.brigades.members', { count: b.membersCount })}
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <form
        noValidate
        onSubmit={handleSubmit(submit)}
        className="mt-4 grid gap-3 border-t border-line pt-4 md:grid-cols-[1fr_1fr_auto] md:items-start"
      >
        <Input
          label={t('settings.brigades.name')}
          error={fieldError(errors.name?.message)}
          {...register('name')}
        />
        <Select
          label={t('settings.brigades.foreman')}
          options={[
            { value: '', label: t('settings.brigades.noForeman') },
            ...(foremen.data?.items ?? []).map((u) => ({ value: u.id, label: u.fullName })),
          ]}
          {...register('foremanId')}
        />
        <Button
          type="submit"
          variant="secondary"
          className="md:mt-6"
          loading={create.isPending}
          icon={<Plus className="size-4" aria-hidden="true" />}
        >
          {t('settings.brigades.add')}
        </Button>
        {create.isError ? (
          <Alert tone="danger" className="md:col-span-3">
            {errorMessage(create.error)}
          </Alert>
        ) : null}
      </form>
    </Card>
  );
}
