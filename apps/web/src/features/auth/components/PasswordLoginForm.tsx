import { zodResolver } from '@hookform/resolvers/zod';
import {
  LoginRequestSchema,
  type LoginRequest,
  type OtpChallenge,
  type Session,
} from '@tigu/shared';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useErrorMessage, useFieldError } from '../../../shared/i18n/useErrorMessage';
import { Alert, Button, PasswordInput, PhoneInput } from '../../../shared/ui';
import { authApi } from '../api/authApi';
import { CodeForm } from './CodeForm';

/** Phone + password, then the 6-digit 2FA code when the server asks for it (spec §9, 1.1). */
export function PasswordLoginForm({ onSuccess }: { onSuccess: (session: Session) => void }) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const fieldError = useFieldError();
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: { phone: '', password: '' },
  });

  const submit = async (values: LoginRequest) => {
    setServerError(null);
    try {
      const res = await authApi.login(values);
      if (res.status === 'OK') onSuccess(res);
      else setChallenge(res);
    } catch (error) {
      setServerError(errorMessage(error));
    }
  };

  const verify = async (code: string) => {
    if (!challenge) return;
    setServerError(null);
    try {
      onSuccess(await authApi.verify2fa({ challengeId: challenge.challengeId, code }));
    } catch (error) {
      setServerError(errorMessage(error));
    }
  };

  if (challenge) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-h2">{t('auth.twoFactor.title')}</h2>
          <p className="mt-1 text-body text-muted">
            {t('auth.twoFactor.text', { channel: t(`auth.channel.${challenge.channel}`) })}
          </p>
        </div>
        <CodeForm
          label={t('auth.twoFactor.code')}
          submitLabel={t('auth.twoFactor.submit')}
          onSubmit={verify}
          error={serverError}
          footer={
            <Button
              variant="ghost"
              onClick={() => {
                setChallenge(null);
                setServerError(null);
              }}
            >
              {t('auth.twoFactor.back')}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
      <Controller
        control={control}
        name="phone"
        render={({ field }) => (
          <PhoneInput
            label={t('auth.login.phone')}
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
        label={t('auth.login.password')}
        error={fieldError(errors.password?.message)}
        {...register('password')}
      />
      <Button type="submit" fullWidth loading={isSubmitting}>
        {t('auth.login.submit')}
      </Button>
    </form>
  );
}
