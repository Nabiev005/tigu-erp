import { CloudOff, Wifi } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../Badge';

/** Connection state with the number of scans waiting to be sent (spec §9, 3.1). */
export function OfflineBadge({ online, queued }: { online: boolean; queued: number }) {
  const { t } = useTranslation();
  if (online && queued === 0) {
    return (
      <Badge tone="success">
        <Wifi className="size-3.5" aria-hidden="true" />
        {t('ui.offline.online')}
      </Badge>
    );
  }
  return (
    <Badge tone="warning">
      {online ? (
        <Wifi className="size-3.5" aria-hidden="true" />
      ) : (
        <CloudOff className="size-3.5" aria-hidden="true" />
      )}
      {online ? null : t('ui.offline.offline')}
      {queued > 0 ? (
        <span className="num">
          {online ? '' : '· '}
          {t('ui.offline.queued', { count: queued })}
        </span>
      ) : null}
    </Badge>
  );
}
