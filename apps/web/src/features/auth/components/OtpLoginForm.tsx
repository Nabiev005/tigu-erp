import { PhoneSchema, type OtpChallenge, type OtpChannel, type Session } from '@tigu/shared';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useErrorMessage, useFieldError } from '../../../shared/i18n/useErrorMessage';
import { Alert, Button, PhoneInput } from '../../../shared/ui';
import { authApi } from '../api/authApi';
import { ChannelPicker } from './ChannelPicker';
import { CodeForm } from './CodeForm';

export interface OtpLoginFormProps {
  initialPhone?: string;
  /** Lock the channel (e.g. "Telegram коду менен кирүү" on the PIN screen). */
  channel?: OtpChannel;
  onSuccess: (session: Session) => void;
}

/** Login with a one-time code: POST /auth/otp/send → POST /auth/otp/verify. */
export function OtpLoginForm({
  initialPhone = '',
  channel: fixedChannel,
  onSuccess,
}: OtpLoginFormProps) {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const fieldError = useFieldError();
  const [phone, setPhone] = useState(initialPhone);
  const [channel, setChannel] = useState<OtpChannel>(fixedChannel ?? 'telegram');
  const [phoneError, setPhoneError] = useState<string>();
  const [serverError, setServerError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [challenge, setChallenge] = useState<OtpChallenge | null>(null);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    const parsed = PhoneSchema.safeParse(phone);
    if (!parsed.success) return setPhoneError(fieldError(parsed.error.issues[0]?.message));
    setPhoneError(undefined);
    setServerError(null);
    setSending(true);
    try {
      setChallenge(await authApi.sendOtp({ phone: parsed.data, channel }));
    } catch (error) {
      setServerError(errorMessage(error));
    } finally {
      setSending(false);
    }
  };

  const verify = async (code: string) => {
    if (!challenge) return;
    setServerError(null);
    try {
      onSuccess(await authApi.verifyOtp({ challengeId: challenge.challengeId, code }));
    } catch (error) {
      setServerError(errorMessage(error));
    }
  };

  if (challenge) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="info">
          {t('auth.otp.sent', { channel: t(`auth.channel.${challenge.channel}`) })}
        </Alert>
        <CodeForm
          label={t('auth.otp.code')}
          submitLabel={t('auth.otp.verify')}
          onSubmit={verify}
          error={serverError}
          footer={
            <Button variant="ghost" loading={sending} onClick={() => void send()}>
              {t('auth.otp.resend')}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <form noValidate onSubmit={send} className="flex flex-col gap-4">
      <p className="text-body text-muted">{t('auth.otp.text')}</p>
      {serverError ? <Alert tone="danger">{serverError}</Alert> : null}
      <PhoneInput
        label={t('auth.login.phone')}
        value={phone}
        onChange={setPhone}
        error={phoneError}
      />
      {fixedChannel ? null : <ChannelPicker value={channel} onChange={setChannel} />}
      <Button type="submit" fullWidth loading={sending}>
        {t('auth.otp.send')}
      </Button>
    </form>
  );
}
