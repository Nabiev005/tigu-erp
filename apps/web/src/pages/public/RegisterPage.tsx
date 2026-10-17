import { useTranslation } from 'react-i18next';
import { RegisterWizard } from '../../features/auth';
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle';

export function RegisterPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('auth.register.title'));
  return (
    <div className="px-4 py-10 sm:px-8 sm:py-16">
      <RegisterWizard />
    </div>
  );
}
