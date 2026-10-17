import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { paths } from '../shared/config/routes';
import { useDocumentTitle } from '../shared/hooks/useDocumentTitle';
import { EmptyState, buttonClasses } from '../shared/ui';

export function NotFoundPage() {
  const { t } = useTranslation();
  useDocumentTitle(t('notFound.title'));
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <EmptyState
        title={t('notFound.title')}
        text={t('notFound.text')}
        action={
          <Link to={paths.home} className={buttonClasses({ variant: 'secondary' })}>
            {t('notFound.home')}
          </Link>
        }
      />
    </div>
  );
}
