import { PhoneSchema, type Session } from '@tigu/shared';
import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { paths } from '../../../shared/config/routes';
import { useDocumentTitle } from '../../../shared/hooks/useDocumentTitle';
import { useFieldError } from '../../../shared/i18n/useErrorMessage';
import { Button, Card, Modal, PhoneInput, TabPanel, Tabs } from '../../../shared/ui';
import { homeFor, useAuth } from '../model/AuthProvider';
import { AuthShell } from './AuthShell';
import { OtpLoginForm } from './OtpLoginForm';
import { PasswordLoginForm } from './PasswordLoginForm';

type LoginTab = 'manager' | 'sewer';
const TABS_ID = 'login';

export interface LocationState {
  from?: string;
  phone?: string;
}

/** Screen 1.1: manager/employee login with password + 2FA, or sewer phone → PIN. */
export function LoginScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from;
  const [params, setParams] = useSearchParams();
  const asClient = params.get('as') === 'client';
  const tab: LoginTab = params.get('tab') === 'sewer' ? 'sewer' : 'manager';
  const [forgotOpen, setForgotOpen] = useState(false);

  useDocumentTitle(asClient ? t('auth.login.clientTitle') : t('auth.login.title'));

  const onSuccess = (session: Session) => {
    signIn(session);
    navigate(from ?? homeFor(session.user), { replace: true });
  };

  return (
    <AuthShell>
      <Card className="flex flex-col gap-6">
        <div>
          <h1 className="text-h1">
            {asClient ? t('auth.login.clientTitle') : t('auth.login.title')}
          </h1>
          <p className="mt-1 text-body text-muted">{t('auth.login.subtitle')}</p>
        </div>

        {asClient ? (
          <PasswordLoginForm onSuccess={onSuccess} />
        ) : (
          <>
            <Tabs<LoginTab>
              idBase={TABS_ID}
              label={t('auth.login.title')}
              variant="pill"
              value={tab}
              onChange={(next) =>
                setParams(next === 'sewer' ? { tab: 'sewer' } : {}, { replace: true })
              }
              items={[
                { id: 'manager', label: t('auth.login.tabManager') },
                { id: 'sewer', label: t('auth.login.tabSewer') },
              ]}
            />
            <TabPanel idBase={TABS_ID} id={tab}>
              {tab === 'manager' ? (
                <PasswordLoginForm onSuccess={onSuccess} />
              ) : (
                <SewerPhoneForm from={from} />
              )}
            </TabPanel>
          </>
        )}

        <div className="flex flex-col gap-2 border-t border-line pt-4 text-body sm:flex-row sm:justify-between">
          <button
            type="button"
            onClick={() => setForgotOpen(true)}
            className="min-h-control text-left font-medium text-primary hover:underline sm:min-h-0"
          >
            {t('auth.login.forgot')}
          </button>
          <Link
            to={asClient ? paths.login : `${paths.login}?as=client`}
            className="flex min-h-control items-center font-medium text-primary hover:underline sm:min-h-0"
          >
            {asClient ? t('auth.login.clientBack') : t('auth.login.asClient')}
          </Link>
        </div>
      </Card>

      <p className="mt-6 text-center text-body text-muted">
        {t('auth.login.noAccount')}{' '}
        <Link to={paths.register} className="font-semibold text-primary hover:underline">
          {t('auth.login.register')}
        </Link>
      </p>

      <Modal open={forgotOpen} onClose={() => setForgotOpen(false)} title={t('auth.otp.title')}>
        <OtpLoginForm onSuccess={onSuccess} />
      </Modal>
    </AuthShell>
  );
}

function SewerPhoneForm({ from }: { from?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const fieldError = useFieldError();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string>();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = PhoneSchema.safeParse(phone);
    if (!parsed.success) return setError(fieldError(parsed.error.issues[0]?.message));
    navigate(paths.pin, { state: { phone: parsed.data, from } satisfies LocationState });
  };

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-body text-muted">{t('auth.login.sewerHint')}</p>
      <PhoneInput label={t('auth.login.phone')} value={phone} onChange={setPhone} error={error} />
      <Button type="submit" fullWidth>
        {t('auth.login.next')}
      </Button>
    </form>
  );
}
