import { Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { paths } from '../../../shared/config/routes';
import { useDocumentTitle } from '../../../shared/hooks/useDocumentTitle';
import { Card, EmptyState, TabPanel, Tabs } from '../../../shared/ui';
import { AuditTab } from './AuditTab';
import { CompanyTab } from './CompanyTab';
import { RolesTab } from './RolesTab';
import { UsersTab } from './UsersTab';

const TABS = ['users', 'roles', 'company', 'telegram', 'audit'] as const;
type SettingsTab = (typeof TABS)[number];
const TABS_ID = 'settings';

const isTab = (value: string | undefined): value is SettingsTab =>
  (TABS as readonly string[]).includes(value ?? '');

/** Screen 2.10: users, roles matrix, company, Telegram bot, audit log. */
export function SettingsScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tab } = useParams<{ tab: string }>();
  useDocumentTitle(t('settings.title'));

  if (!isTab(tab)) return <Navigate to={`${paths.settings}/users`} replace />;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1">{t('settings.title')}</h1>
      <Tabs<SettingsTab>
        idBase={TABS_ID}
        label={t('settings.title')}
        value={tab}
        onChange={(next) => navigate(`${paths.settings}/${next}`)}
        items={TABS.map((id) => ({ id, label: t(`settings.tabs.${id}`) }))}
      />
      <TabPanel idBase={TABS_ID} id={tab}>
        {tab === 'users' ? <UsersTab /> : null}
        {tab === 'roles' ? <RolesTab /> : null}
        {tab === 'company' ? <CompanyTab /> : null}
        {tab === 'telegram' ? (
          <Card>
            <EmptyState
              icon={<Send className="size-6" aria-hidden="true" />}
              title={t('settings.telegram.title')}
              text={t('settings.telegram.text')}
            />
          </Card>
        ) : null}
        {tab === 'audit' ? <AuditTab /> : null}
      </TabPanel>
    </div>
  );
}
