import { RoleSchema, maskPhone, type Role, type User } from '@tigu/shared';
import { Pencil, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '../../../shared/hooks/useDebounce';
import { formatMoney } from '../../../shared/lib/formatMoney';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  Select,
  Skeleton,
  Table,
} from '../../../shared/ui';
import { useCurrentUser } from '../../auth';
import { useBrigades, useUsers } from '../api/settingsApi';
import { BrigadesPanel } from './BrigadesPanel';
import { UserFormModal } from './UserFormModal';

const PAGE_SIZE = 20;

export function UsersTab() {
  const { t } = useTranslation();
  const me = useCurrentUser();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const q = useDebounce(search.trim(), 300);

  const users = useUsers({ q: q || undefined, role: role || undefined, page, pageSize: PAGE_SIZE });
  const brigades = useBrigades();
  const brigadeName = new Map((brigades.data ?? []).map((b) => [b.id, b.name]));

  const data = users.data;
  const from = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = data ? Math.min(data.page * data.pageSize, data.total) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <Input
          label={t('settings.users.search')}
          hideLabel
          placeholder={t('settings.users.search')}
          prefix={<Search className="size-4" aria-hidden="true" />}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          containerClassName="md:max-w-sm md:flex-1"
          className="pl-10"
        />
        <Select
          label={t('settings.users.roleFilter')}
          hideLabel
          value={role}
          onChange={(e) => {
            setRole(e.target.value as Role | '');
            setPage(1);
          }}
          options={[
            { value: '', label: t('settings.users.allRoles') },
            ...RoleSchema.options.map((r) => ({ value: r, label: t(`roles.${r}`) })),
          ]}
          containerClassName="md:w-56"
        />
        <Button
          className="md:ml-auto"
          icon={<Plus className="size-4" aria-hidden="true" />}
          onClick={() => setCreating(true)}
        >
          {t('settings.users.add')}
        </Button>
      </div>

      {users.isPending ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : users.isError ? (
        <ErrorState error={users.error} onRetry={() => void users.refetch()} />
      ) : (
        <>
          <Table
            caption={t('settings.tabs.users')}
            rows={data?.items ?? []}
            rowKey={(u) => u.id}
            empty={
              <EmptyState title={t('settings.users.empty')} text={t('settings.users.emptyText')} />
            }
            columns={[
              {
                key: 'name',
                header: t('settings.users.columns.name'),
                render: (u) => (
                  <span className={u.isActive ? 'font-medium' : 'text-muted line-through'}>
                    {u.fullName}
                  </span>
                ),
              },
              {
                key: 'phone',
                header: t('settings.users.columns.phone'),
                render: (u) => <span className="text-muted num">{maskPhone(u.phone)}</span>,
              },
              {
                key: 'role',
                header: t('settings.users.columns.role'),
                render: (u) => t(`roles.${u.role}`),
              },
              {
                key: 'brigade',
                header: t('settings.users.columns.brigade'),
                render: (u) => (u.brigadeId ? (brigadeName.get(u.brigadeId) ?? '—') : '—'),
              },
              {
                key: 'pay',
                header: t('settings.users.columns.pay'),
                render: (u) => (
                  <span>
                    {t(`settings.users.payType.${u.payType}`)}
                    {u.payType === 'SALARY' && u.monthlySalary !== null ? (
                      <span className="ml-2 text-muted num">{formatMoney(u.monthlySalary)}</span>
                    ) : null}
                  </span>
                ),
              },
              {
                key: 'status',
                header: t('settings.users.columns.status'),
                render: (u) => (
                  <span className="flex flex-wrap gap-1">
                    <Badge tone={u.isActive ? 'success' : 'soft'}>
                      {u.isActive ? t('settings.users.active') : t('settings.users.inactive')}
                    </Badge>
                    {u.pinLocked ? (
                      <Badge tone="danger">{t('settings.users.pinLocked')}</Badge>
                    ) : null}
                  </span>
                ),
              },
              {
                key: 'actions',
                header: '',
                align: 'right',
                render: (u) => (
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={t('settings.users.edit', { name: u.fullName })}
                    icon={<Pencil className="size-4" aria-hidden="true" />}
                    onClick={() => setEditing(u)}
                  />
                ),
              },
            ]}
          />
          {data && data.total > data.pageSize ? (
            <div className="flex items-center justify-between gap-3 text-body text-muted">
              <span className="num">
                {t('settings.users.range', { from, to, total: data.total })}
              </span>
              <div className="flex gap-2">
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
                  disabled={to >= data.total}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('settings.users.next')}
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      <BrigadesPanel />

      <UserFormModal
        open={creating || editing !== null}
        user={editing}
        currentUserId={me.id}
        brigades={brigades.data ?? []}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
