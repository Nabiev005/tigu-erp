import { zodResolver } from '@hookform/resolvers/zod';
import {
  ModelCreateRequestSchema,
  RegisterRequestSchema,
  UserQuickCreateRequestSchema,
  formatPhone,
  type OtpChallenge,
  type Role,
} from '@tigu/shared';
import { Check, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { paths } from '../../../shared/config/routes';
import { useErrorMessage, useFieldError } from '../../../shared/i18n/useErrorMessage';
import { cn } from '../../../shared/lib/cn';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  FileDrop,
  Input,
  PasswordInput,
  PhoneInput,
  Select,
} from '../../../shared/ui';
import { authApi } from '../api/authApi';
import { onboardingApi } from '../api/onboardingApi';
import { useAuth } from '../model/AuthProvider';
import { ChannelPicker } from './ChannelPicker';
import { CodeForm } from './CodeForm';

type Step = 1 | 2 | 3;
const STEP_KEYS = ['company', 'verify', 'start'] as const;

/** Screen 6.2: company + owner → phone confirmation → first model and employees (optional). */
export function RegisterWizard() {
  const { t } = useTranslation();
  const [step, setStep] = useState<Step>(1);
  const [challenge, setChallenge] = useState<(OtpChallenge & { phone: string }) | null>(null);

  return (
    <div className="mx-auto w-full max-w-xl">
      <h1 className="text-h1">{t('auth.register.title')}</h1>
      <p className="mt-1 text-body text-muted">{t('auth.register.subtitle')}</p>

      <ol
        className="mt-6 grid grid-cols-3 gap-2"
        aria-label={t('auth.register.stepOf', { current: step, total: 3 })}
      >
        {STEP_KEYS.map((key, index) => {
          const n = (index + 1) as Step;
          const done = n < step;
          const current = n === step;
          return (
            <li
              key={key}
              aria-current={current ? 'step' : undefined}
              className="flex flex-col gap-2"
            >
              <span
                className={cn(
                  'h-1.5 rounded-full',
                  done ? 'bg-success' : current ? 'bg-primary' : 'bg-line',
                )}
              />
              <span
                className={cn(
                  'flex items-center gap-1 text-caption',
                  current ? 'font-semibold text-ink' : 'text-muted',
                )}
              >
                {done ? <Check className="size-3.5 text-success" aria-hidden="true" /> : null}
                <span className="num">{n}.</span> {t(`auth.register.steps.${key}`)}
              </span>
            </li>
          );
        })}
      </ol>

      <Card className="mt-6">
        {step === 1 ? (
          <CompanyStep
            onDone={(c) => {
              setChallenge(c);
              setStep(2);
            }}
          />
        ) : step === 2 && challenge ? (
          <VerifyStep challenge={challenge} onDone={() => setStep(3)} />
        ) : (
          <StartStep />
        )}
      </Card>

      {step === 1 ? (
        <p className="mt-6 text-center text-body text-muted">
          {t('auth.register.haveAccount')}{' '}
          <Link to={paths.login} className="font-semibold text-primary hover:underline">
            {t('auth.register.login')}
          </Link>
        </p>
      ) : null}
    </div>
  );
}

// ---------- Step 1 ----------

const CompanyFormSchema = RegisterRequestSchema.extend({
  acceptTerms: z.boolean().refine((v) => v, 'validation.terms'),
});
type CompanyFormInput = z.input<typeof CompanyFormSchema>;
type CompanyFormOutput = z.output<typeof CompanyFormSchema>;

function CompanyStep({ onDone }: { onDone: (c: OtpChallenge & { phone: string }) => void }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const fieldError = useFieldError();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompanyFormInput, unknown, CompanyFormOutput>({
    resolver: zodResolver(CompanyFormSchema),
    defaultValues: {
      companyName: '',
      city: '',
      ownerFullName: '',
      phone: '',
      password: '',
      channel: 'telegram',
      acceptTerms: false,
    },
  });

  const submit = async ({ acceptTerms: _terms, ...values }: CompanyFormOutput) => {
    setServerError(null);
    try {
      const challenge = await authApi.register({ ...values, acceptTerms: true });
      onDone({ ...challenge, phone: values.phone });
    } catch (error) {
      setServerError(errorMessage(error));
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
      <Input
        label={t('auth.register.companyName')}
        autoComplete="organization"
        error={fieldError(errors.companyName?.message)}
        {...register('companyName')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={t('auth.register.employeesCount')}
          type="number"
          inputMode="numeric"
          min={1}
          error={fieldError(errors.employeesCount?.message)}
          {...register('employeesCount', { valueAsNumber: true })}
        />
        <Input
          label={t('auth.register.city')}
          autoComplete="address-level2"
          error={fieldError(errors.city?.message)}
          {...register('city')}
        />
      </div>
      <Input
        label={t('auth.register.ownerFullName')}
        autoComplete="name"
        error={fieldError(errors.ownerFullName?.message)}
        {...register('ownerFullName')}
      />
      <Controller
        control={control}
        name="phone"
        render={({ field }) => (
          <PhoneInput
            label={t('auth.register.phone')}
            value={field.value}
            onChange={field.onChange}
            onBlur={field.onBlur}
            name={field.name}
            ref={field.ref}
            error={fieldError(errors.phone?.message)}
          />
        )}
      />
      <PasswordInput
        label={t('auth.register.password')}
        hint={t('auth.register.passwordHint')}
        autoComplete="new-password"
        error={fieldError(errors.password?.message)}
        {...register('password')}
      />
      <Controller
        control={control}
        name="channel"
        render={({ field }) => <ChannelPicker value={field.value} onChange={field.onChange} />}
      />
      <Checkbox
        label={t('auth.register.acceptTerms')}
        error={fieldError(errors.acceptTerms?.message)}
        {...register('acceptTerms')}
      />
      <Button type="submit" fullWidth loading={isSubmitting}>
        {t('auth.register.submit')}
      </Button>
    </form>
  );
}

// ---------- Step 2 ----------

function VerifyStep({
  challenge,
  onDone,
}: {
  challenge: OtpChallenge & { phone: string };
  onDone: () => void;
}) {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const errorMessage = useErrorMessage();
  const [error, setError] = useState<string | null>(null);

  const verify = async (code: string) => {
    setError(null);
    try {
      signIn(await authApi.verifyOtp({ challengeId: challenge.challengeId, code }));
      onDone();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-h2">{t('auth.register.verifyTitle')}</h2>
        <p className="mt-1 text-body text-muted">
          {t('auth.register.verifyText', {
            phone: formatPhone(challenge.phone),
            channel: t(`auth.channel.${challenge.channel}`),
          })}
        </p>
      </div>
      <CodeForm
        label={t('auth.otp.code')}
        submitLabel={t('auth.register.verifySubmit')}
        onSubmit={verify}
        error={error}
      />
    </div>
  );
}

// ---------- Step 3 ----------

const EMPLOYEE_ROLES = UserQuickCreateRequestSchema.shape.role.options;

const StartFormSchema = z
  .object({
    article: z.string().trim(),
    name: z.string().trim(),
    sizes: z.string().trim(),
    employees: z.array(UserQuickCreateRequestSchema),
  })
  .superRefine((value, ctx) => {
    const touched = value.article || value.name || value.sizes;
    if (!touched) return;
    const parsed = ModelCreateRequestSchema.safeParse({
      article: value.article,
      name: value.name,
      sizes: value.sizes
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    });
    if (parsed.success) return;
    for (const issue of parsed.error.issues)
      ctx.addIssue({ ...issue, path: issue.path.slice(0, 1) });
  });
type StartFormValues = z.infer<typeof StartFormSchema>;

function StartStep() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const errorMessage = useErrorMessage();
  const fieldError = useFieldError();
  const [file, setFile] = useState<File[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<StartFormValues>({
    resolver: zodResolver(StartFormSchema),
    defaultValues: { article: '', name: '', sizes: '', employees: [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'employees' });

  const finish = async (values: StartFormValues) => {
    setServerError(null);
    try {
      if (values.article) {
        await onboardingApi.createModel({
          article: values.article,
          name: values.name,
          sizes: values.sizes
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        });
      }
      const [excel] = file;
      if (excel) await onboardingApi.importModels(excel);
      for (const employee of values.employees) await onboardingApi.createUser(employee);
      navigate(paths.admin, { replace: true });
    } catch (error) {
      setServerError(errorMessage(error));
    }
  };

  const roleOptions = EMPLOYEE_ROLES.map((role: Role) => ({
    value: role,
    label: t(`roles.${role}`),
  }));

  return (
    <form noValidate onSubmit={handleSubmit(finish)} className="flex flex-col gap-6">
      <div>
        <h2 className="text-h2">{t('auth.register.startTitle')}</h2>
        <p className="mt-1 text-body text-muted">{t('auth.register.startText')}</p>
      </div>
      {serverError ? <Alert tone="danger">{serverError}</Alert> : null}

      <section className="flex flex-col gap-4">
        <h3 className="text-body font-semibold">{t('auth.register.modelTitle')}</h3>
        <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
          <Input
            label={t('auth.register.modelArticle')}
            error={fieldError(errors.article?.message)}
            {...register('article')}
          />
          <Input
            label={t('auth.register.modelName')}
            error={fieldError(errors.name?.message)}
            {...register('name')}
          />
        </div>
        <Input
          label={t('auth.register.modelSizes')}
          hint={t('auth.register.modelSizesHint')}
          error={fieldError(errors.sizes?.message)}
          {...register('sizes')}
        />
        <FileDrop
          label={t('auth.register.modelImport')}
          accept={['.xlsx']}
          maxSizeMb={20}
          files={file}
          onChange={setFile}
        />
      </section>

      <section className="flex flex-col gap-4 border-t border-line pt-6">
        <div>
          <h3 className="text-body font-semibold">{t('auth.register.employeesTitle')}</h3>
          <p className="text-caption text-muted">{t('auth.register.employeesHint')}</p>
        </div>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid gap-3 rounded-card border border-line p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-start"
          >
            <Input
              label={t('auth.register.employeeFullName')}
              error={fieldError(errors.employees?.[index]?.fullName?.message)}
              {...register(`employees.${index}.fullName`)}
            />
            <Controller
              control={control}
              name={`employees.${index}.phone`}
              render={({ field: f }) => (
                <PhoneInput
                  label={t('auth.register.employeePhone')}
                  value={f.value}
                  onChange={f.onChange}
                  onBlur={f.onBlur}
                  name={f.name}
                  ref={f.ref}
                  error={fieldError(errors.employees?.[index]?.phone?.message)}
                />
              )}
            />
            <div className="flex items-end gap-2 sm:col-span-full sm:grid sm:grid-cols-[1fr_auto]">
              <Select
                label={t('auth.register.employeeRole')}
                options={roleOptions}
                containerClassName="flex-1"
                {...register(`employees.${index}.role`)}
              />
              <Button
                variant="ghost"
                onClick={() => remove(index)}
                aria-label={t('auth.register.employeeRemove', { index: index + 1 })}
                icon={<Trash2 className="size-4" aria-hidden="true" />}
              />
            </div>
          </div>
        ))}
        <Button
          variant="secondary"
          icon={<Plus className="size-4" aria-hidden="true" />}
          onClick={() => append({ fullName: '', phone: '', role: 'SEWER' })}
          className="self-start"
        >
          {t('auth.register.employeeAdd')}
        </Button>
      </section>

      <div className="flex flex-col-reverse gap-2 border-t border-line pt-6 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={() => navigate(paths.admin, { replace: true })}>
          {t('auth.register.skip')}
        </Button>
        <Button type="submit" loading={isSubmitting}>
          {t('auth.register.finish')}
        </Button>
      </div>
    </form>
  );
}
