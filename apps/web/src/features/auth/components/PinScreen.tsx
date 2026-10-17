import { formatPhone, type Session } from '@tigu/shared';
import { ChevronLeft, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiClientError } from '../../../shared/api/types';
import { paths } from '../../../shared/config/routes';
import { useDocumentTitle } from '../../../shared/hooks/useDocumentTitle';
import { useErrorMessage } from '../../../shared/i18n/useErrorMessage';
import { vibrate } from '../../../shared/lib/vibrate';
import { Alert, Button, Modal, PinPad } from '../../../shared/ui';
import { authApi } from '../api/authApi';
import { homeFor, useAuth } from '../model/AuthProvider';
import { AuthShell } from './AuthShell';
import type { LocationState } from './LoginScreen';
import { OtpLoginForm } from './OtpLoginForm';

const PIN_LENGTH = 4;

function remaining(until: number, now: number): string {
  const total = Math.max(0, Math.ceil((until - now) / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Screen 1.2: 4-digit PIN; 5 wrong attempts lock login for 15 minutes (enforced by the API). */
export function PinScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const phone = state?.phone;
  const errorMessage = useErrorMessage();

  const [pin, setPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [otpOpen, setOtpOpen] = useState(false);

  useDocumentTitle(t('auth.pin.title'));

  useEffect(() => {
    if (!lockedUntil) return;
    const id = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= lockedUntil) {
        setLockedUntil(null);
        setError(null);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [lockedUntil]);

  if (!phone) return <Navigate to={`${paths.login}?tab=sewer`} replace />;

  const onSuccess = (session: Session) => {
    signIn(session);
    navigate(state?.from ?? homeFor(session.user), { replace: true });
  };

  const onFailure = (err: unknown) => {
    vibrate('error');
    setPin('');
    if (err instanceof ApiClientError && err.code === 'PIN_LOCKED') {
      const until = Date.parse(String(err.details?.lockedUntil ?? ''));
      if (!Number.isNaN(until)) {
        setLockedUntil(until);
        setNow(Date.now());
      }
      setError(errorMessage(err));
    } else if (
      err instanceof ApiClientError &&
      err.code === 'INVALID_CREDENTIALS' &&
      typeof err.details?.attemptsLeft === 'number'
    ) {
      setError(t('auth.pin.attemptsLeft', { count: err.details.attemptsLeft }));
    } else {
      setError(errorMessage(err));
    }
  };

  const onPinChange = (next: string) => {
    setPin(next);
    if (next.length > 0) setError(null);
    if (next.length !== PIN_LENGTH) return;
    setSubmitting(true);
    authApi
      .pin({ phone, pin: next })
      .then(onSuccess, onFailure)
      .finally(() => setSubmitting(false));
  };

  const locked = lockedUntil !== null;

  return (
    <AuthShell>
      <div className="flex flex-col items-center gap-6 text-center">
        <div>
          <h1 className="text-worker-title">{t('auth.pin.title')}</h1>
          <p className="mt-1 text-worker text-muted">
            {t('auth.pin.for', { phone: formatPhone(phone) })}
          </p>
        </div>

        <div className="min-h-14 w-full">
          {locked ? (
            <Alert tone="danger">
              {t('auth.pin.locked', { time: remaining(lockedUntil, now) })}
            </Alert>
          ) : error ? (
            <Alert tone="danger">{error}</Alert>
          ) : null}
        </div>

        <PinPad
          value={pin}
          onChange={onPinChange}
          length={PIN_LENGTH}
          disabled={submitting || locked}
          error={Boolean(error) && pin.length === 0}
        />

        <div className="flex w-full flex-col gap-2">
          <Button
            variant="secondary"
            fullWidth
            icon={<Send className="size-4" aria-hidden="true" />}
            onClick={() => setOtpOpen(true)}
          >
            {t('auth.pin.byTelegram')}
          </Button>
          <Link
            to={`${paths.login}?tab=sewer`}
            className="inline-flex min-h-control items-center justify-center gap-1 text-body font-medium text-primary"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            {t('auth.pin.changePhone')}
          </Link>
        </div>
      </div>

      <Modal open={otpOpen} onClose={() => setOtpOpen(false)} title={t('auth.pin.byTelegram')}>
        <OtpLoginForm initialPhone={phone} channel="telegram" onSuccess={onSuccess} />
      </Modal>
    </AuthShell>
  );
}
