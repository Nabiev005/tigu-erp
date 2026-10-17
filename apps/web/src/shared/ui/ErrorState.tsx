import { AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useErrorMessage } from '../i18n/useErrorMessage';
import { Button } from './Button';
import { EmptyState } from './EmptyState';

/** Error state with a retry button (spec §9: every screen has one). */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { t } = useTranslation();
  const message = useErrorMessage();
  return (
    <EmptyState
      icon={<AlertTriangle className="size-6 text-danger" aria-hidden="true" />}
      title={t('common.errorTitle')}
      text={message(error)}
      action={
        onRetry ? (
          <Button variant="secondary" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        ) : undefined
      }
    />
  );
}
