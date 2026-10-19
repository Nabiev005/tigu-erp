import type { AuditLogEntry } from '@tigu/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '../../../shared/lib/formatDate';
import { Button, EmptyState, ErrorState, Select, Skeleton, Table } from '../../../shared/ui';
import { useAuditLog } from '../api/settingsApi';

const ENTITIES = ['User', 'Tenant', 'Brigade'] as const;
const PAGE_SIZE = 50;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** "Ролу: Кесүүчү → Бригадир" lines from before/after snapshots. */
function Changes({ entry }: { entry: AuditLogEntry }) {
  const { t, i18n } = useTranslation();
  const before = isRecord(entry.before) ? entry.before : {};
  const after = isRecord(entry.after) ? entry.after : {};
  const keys = [...new Set([...Object.keys(before), ...Object.keys(after)])];
  if (keys.length === 0) return <span className="text-muted">—</span>;

  const show = (key: string, value: unknown): string => {
    if (value === undefined || value === null || value === '') return '—';
    if (typeof value === 'boolean') return value ? t('settings.audit.yes') : t('settings.audit.no');
    if (key === 'role' && typeof value === 'string') return t(`roles.${value}`);
    if (key === 'locale' && typeof value === 'string') return t(`locale.${value}`);
    if (key === 'payType' && typeof value === 'string') return t(`settings.users.payType.${value}`);
    if (key === 'workDays' && Array.isArray(value)) {
      return value.map((d) => t(`settings.weekdays.${String(d)}`).slice(0, 2)).join(', ');
    }
    if (isRecord(value)) {
      const on = Object.entries(value)
        .filter(([, v]) => v === true)
        .map(([k]) => k);
      return on.length ? on.join(', ') : '—';
    }
    return String(value);
  };

  return (
    <ul className="flex flex-col gap-0.5 text-caption">
      {keys.map((key) => {
        const label = i18n.exists(`settings.audit.fields.${key}`)
          ? t(`settings.audit.fields.${key}`)
          : key;
        const hasBefore = key in before;
        return (
          <li key={key}>
            <span className="text-muted">{label}:</span>{' '}
            {hasBefore ? (
              <>
                <span className="line-through opacity-70">{show(key, before[key])}</span> →{' '}
              </>
            ) : null}
            <span className="font-medium">{show(key, after[key])}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function AuditTab() {
  const { t, i18n } = useTranslation();
  const [entity, setEntity] = useState('');
  const [page, setPage] = useState(1);
  const log = useAuditLog({ entity: entity || undefined, page, pageSize: PAGE_SIZE });

  return (
    <div className="flex flex-col gap-4">
      <Select
        label={t('settings.audit.entityFilter')}
        value={entity}
        onChange={(e) => {
          setEntity(e.target.value);
          setPage(1);
        }}
        options={[
          { value: '', label: t('settings.audit.allEntities') },
          ...ENTITIES.map((e) => ({ value: e, label: t(`settings.audit.entities.${e}`) })),
        ]}
        containerClassName="sm:w-64"
      />
      {log.isPending ? (
        <Skeleton className="h-64" />
      ) : log.isError ? (
        <ErrorState error={log.error} onRetry={() => void log.refetch()} />
      ) : (
        <>
          <Table
            caption={t('settings.tabs.audit')}
            rows={log.data.items}
            rowKey={(e) => e.id}
            empty={<EmptyState title={t('settings.audit.empty')} />}
            columns={[
              {
                key: 'at',
                header: t('settings.audit.columns.at'),
                render: (e) => (
                  <span className="num whitespace-nowrap">{formatDateTime(e.createdAt)}</span>
                ),
              },
              {
                key: 'user',
                header: t('settings.audit.columns.user'),
                render: (e) => e.userName ?? '—',
              },
              {
                key: 'action',
                header: t('settings.audit.columns.action'),
                render: (e) => (
                  <span>
                    {i18n.exists(`settings.audit.actions.${e.action}`)
                      ? t(`settings.audit.actions.${e.action}`)
                      : e.action}
                    <span className="block text-caption text-muted">
                      {i18n.exists(`settings.audit.entities.${e.entity}`)
                        ? t(`settings.audit.entities.${e.entity}`)
                        : e.entity}
                    </span>
                  </span>
                ),
              },
              {
                key: 'changes',
                header: t('settings.audit.columns.changes'),
                className: 'whitespace-normal',
                render: (e) => <Changes entry={e} />,
              },
            ]}
          />
          {log.data.total > PAGE_SIZE ? (
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                {t('settings.users.prev')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page * PAGE_SIZE >= log.data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                {t('settings.users.next')}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
