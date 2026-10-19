import { zodResolver } from '@hookform/resolvers/zod';
import {
  PhoneSchema,
  RoleSchema,
  formatPhone,
  type Brigade,
  type Role,
  type User,
  type UserCreateRequest,
  type UserUpdateRequest,
} from '@tigu/shared';
import { KeyRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useErrorMessage, useFieldError } from '../../../shared/i18n/useErrorMessage';
import { somInputToTiyin, tiyinToSomInput } from '../../../shared/lib/money';
import {
  Alert,
  Button,
  Checkbox,
  Input,
  Modal,
  PhoneInput,
  Select,
  useToast,
} from '../../../shared/ui';
import { useCreateUser, useResetPin, useUpdateUser } from '../api/settingsApi';

const FormSchema = z
  .object({
    fullName: z.string().trim().min(2, 'validation.required').max(120),
    phone: z.string(),
    role: RoleSchema,
    brigadeId: z.string(),
    payType: z.enum(['PIECE', 'SALARY']),
    salary: z.string(),
    canSeePrices: z.boolean(),
    canSeeCost: z.boolean(),
    twoFactorEnabled: z.boolean(),
    isActive: z.boolean(),
  })
  .superRefine((value, ctx) => {
    if (value.payType === 'SALARY' && somInputToTiyin(value.salary) === null) {
      ctx.addIssue({
        code: 'custom',
        path: ['salary'],
        message: value.salary ? 'validation.money' : 'validation.salaryRequired',
      });
    }
  });
type FormValues = z.infer<typeof FormSchema>;

export interface UserFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Edit mode when set. */
  user?: User | null;
  currentUserId: string;
  brigades: readonly Brigade[];
}

function defaults(user?: User | null): FormValues {
  return {
    fullName: user?.fullName ?? '',
    phone: user?.phone ?? '',
    role: user?.role ?? 'SEWER',
    brigadeId: user?.brigadeId ?? '',
    payType: user?.payType ?? 'PIECE',
    salary: tiyinToSomInput(user?.monthlySalary),
    canSeePrices: user?.permissions.canSeePrices ?? false,
    canSeeCost: user?.permissions.canSeeCost ?? false,
    twoFactorEnabled: user?.twoFactorEnabled ?? true,
    isActive: user?.isActive ?? true,
  };
}

export function UserFormModal({
  open,
  onClose,
  user,
  currentUserId,
  brigades,
}: UserFormModalProps) {
  const { t } = useTranslation();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const fieldError = useFieldError();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const resetPin = useResetPin();
  const [serverError, setServerError] = useState<string | null>(null);
  const editing = Boolean(user);
  const isSelf = user?.id === currentUserId;

  const {
    control,
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues: defaults(user) });

  useEffect(() => {
    if (open) {
      reset(defaults(user));
      setServerError(null);
    }
  }, [open, user, reset]);

  const role = useWatch({ control, name: 'role' });
  const payType = useWatch({ control, name: 'payType' });

  const submit = async (values: FormValues) => {
    setServerError(null);
    const common = {
      fullName: values.fullName,
      role: values.role,
      brigadeId: values.brigadeId || null,
      payType: values.payType,
      monthlySalary: values.payType === 'SALARY' ? somInputToTiyin(values.salary) : null,
      permissions:
        values.role === 'OWNER'
          ? {}
          : { canSeePrices: values.canSeePrices, canSeeCost: values.canSeeCost },
    };
    try {
      if (user) {
        const body: UserUpdateRequest = {
          ...common,
          twoFactorEnabled: values.twoFactorEnabled,
          isActive: values.isActive,
        };
        await updateUser.mutateAsync({ id: user.id, body });
        toast.show({ tone: 'success', title: t('settings.userForm.saved') });
      } else {
        const phone = PhoneSchema.safeParse(values.phone);
        if (!phone.success) {
          setError('phone', { message: 'validation.phone' });
          return;
        }
        const body: UserCreateRequest = { ...common, phone: phone.data };
        await createUser.mutateAsync(body);
        toast.show({
          tone: 'success',
          title: t(
            values.role === 'SEWER'
              ? 'settings.userForm.createdSewer'
              : 'settings.userForm.createdPassword',
            { phone: formatPhone(phone.data) },
          ),
        });
      }
      onClose();
    } catch (error) {
      setServerError(errorMessage(error));
    }
  };

  const onResetPin = async () => {
    if (!user) return;
    try {
      await resetPin.mutateAsync(user.id);
      toast.show({ tone: 'success', title: t('settings.userForm.pinReset') });
    } catch (error) {
      setServerError(errorMessage(error));
    }
  };

  const roleOptions = RoleSchema.options.map((r: Role) => ({ value: r, label: t(`roles.${r}`) }));
  const brigadeOptions = [
    { value: '', label: t('settings.userForm.noBrigade') },
    ...brigades.map((b) => ({ value: b.id, label: b.name })),
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? t('settings.userForm.editTitle') : t('settings.userForm.createTitle')}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" form="user-form" loading={isSubmitting}>
            {t('common.save')}
          </Button>
        </>
      }
    >
      <form
        id="user-form"
        noValidate
        onSubmit={handleSubmit(submit)}
        className="flex flex-col gap-4"
      >
        {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
        <Input
          label={t('settings.userForm.fullName')}
          autoComplete="off"
          error={fieldError(errors.fullName?.message)}
          {...register('fullName')}
        />
        {editing && user ? (
          <Input
            label={t('settings.userForm.phone')}
            value={formatPhone(user.phone)}
            hint={t('settings.userForm.phoneLocked')}
            disabled
            readOnly
          />
        ) : (
          <Controller
            control={control}
            name="phone"
            render={({ field }) => (
              <PhoneInput
                label={t('settings.userForm.phone')}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
                error={fieldError(errors.phone?.message)}
              />
            )}
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t('settings.userForm.role')}
            options={roleOptions}
            disabled={isSelf}
            {...register('role')}
          />
          <Select
            label={t('settings.userForm.brigade')}
            options={brigadeOptions}
            {...register('brigadeId')}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label={t('settings.userForm.payType')}
            options={[
              { value: 'PIECE', label: t('settings.users.payType.PIECE') },
              { value: 'SALARY', label: t('settings.users.payType.SALARY') },
            ]}
            {...register('payType')}
          />
          {payType === 'SALARY' ? (
            <Input
              label={t('settings.userForm.monthlySalary')}
              inputMode="numeric"
              className="num"
              error={fieldError(errors.salary?.message)}
              {...register('salary')}
            />
          ) : null}
        </div>

        {role !== 'OWNER' ? (
          <fieldset className="flex flex-col">
            <legend className="text-body font-medium text-body-2">
              {t('settings.userForm.permissions')}
            </legend>
            <Checkbox label={t('settings.userForm.canSeePrices')} {...register('canSeePrices')} />
            <Checkbox label={t('settings.userForm.canSeeCost')} {...register('canSeeCost')} />
          </fieldset>
        ) : null}

        {editing ? (
          <div className="flex flex-col border-t border-line pt-2">
            {role !== 'SEWER' ? (
              <Checkbox
                label={t('settings.userForm.twoFactor')}
                {...register('twoFactorEnabled')}
              />
            ) : null}
            <Checkbox
              label={t('settings.userForm.isActive')}
              disabled={isSelf}
              {...register('isActive')}
            />
            {user?.role === 'SEWER' ? (
              <Button
                variant="secondary"
                className="mt-2 self-start"
                icon={<KeyRound className="size-4" aria-hidden="true" />}
                loading={resetPin.isPending}
                onClick={() => void onResetPin()}
              >
                {t('settings.userForm.resetPin')}
              </Button>
            ) : null}
          </div>
        ) : (
          <p className="text-caption text-muted">
            {role === 'SEWER'
              ? t('settings.userForm.credentialHintSewer')
              : t('settings.userForm.credentialHintPassword')}
          </p>
        )}
      </form>
    </Modal>
  );
}
