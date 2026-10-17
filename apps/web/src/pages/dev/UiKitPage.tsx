import { OrderStatusSchema, type OrderStatus } from '@tigu/shared';
import { Plus, Wallet } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle';
import { formatDate } from '../../shared/lib/formatDate';
import { formatMoney } from '../../shared/lib/formatMoney';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  CodeInput,
  EmptyState,
  FileDrop,
  Input,
  LanguageSwitcher,
  Logo,
  Modal,
  OfflineBadge,
  OperationOption,
  PasswordInput,
  PhoneInput,
  PinPad,
  ProgressBar,
  ScanButton,
  Select,
  Skeleton,
  SkeletonText,
  StatCard,
  StatusBadge,
  Table,
  Tabs,
  Textarea,
  useToast,
} from '../../shared/ui';

// Developer showcase of every shared/ui component (stage 1 acceptance: /dev/ui).
// Section headings are component names, so they are not translated.

interface DemoOrder {
  id: string;
  number: string;
  customer: string;
  qty: number;
  progress: number;
  deadline: string;
  status: OrderStatus;
  late: boolean;
}

const DEMO_ORDERS: DemoOrder[] = [
  {
    id: '1',
    number: 'Б-0142',
    customer: 'Ала-Тоо Текстиль',
    qty: 1200,
    progress: 72,
    deadline: '2026-10-24',
    status: 'SEWING',
    late: false,
  },
  {
    id: '2',
    number: 'Б-0139',
    customer: 'Nomad Wear',
    qty: 800,
    progress: 45,
    deadline: '2026-10-19',
    status: 'SEWING',
    late: true,
  },
  {
    id: '3',
    number: 'Б-0145',
    customer: 'Bishkek Kids',
    qty: 600,
    progress: 0,
    deadline: '2026-11-02',
    status: 'NEW',
    late: false,
  },
];

function Demo({ name, children }: { name: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-h2">
        <code className="num">{name}</code>
      </h2>
      {children}
    </section>
  );
}

export function UiKitPage() {
  const { t } = useTranslation();
  const toast = useToast();
  useDocumentTitle(t('dev.ui.title'));

  const [tab, setTab] = useState<'all' | 'SEWING' | 'NEW'>('all');
  const [phone, setPhone] = useState('+996555123456');
  const [modalOpen, setModalOpen] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [operation, setOperation] = useState('op-3');
  const [pin, setPin] = useState('');

  return (
    <div className="mx-auto flex max-w-content flex-col gap-12 px-4 py-8 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Logo />
          <h1 className="mt-4 text-h1">{t('dev.ui.title')}</h1>
          <p className="text-body text-muted">{t('dev.ui.subtitle')}</p>
        </div>
        <LanguageSwitcher />
      </header>

      <Demo name="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button>{t('common.save')}</Button>
          <Button variant="secondary">{t('common.cancel')}</Button>
          <Button variant="success">{t('auth.twoFactor.submit')}</Button>
          <Button variant="danger">{t('common.remove')}</Button>
          <Button variant="ghost">{t('common.back')}</Button>
          <Button loading>{t('common.save')}</Button>
          <Button disabled>{t('common.save')}</Button>
          <Button icon={<Plus className="size-4" aria-hidden="true" />}>
            {t('nav.ordersCreate')}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">sm · 36px</Button>
          <Button size="md">md · 44px</Button>
          <Button size="xl">xl · 64px</Button>
        </div>
      </Demo>

      <Demo name="Input / Select / Textarea / Checkbox">
        <div className="grid gap-4 md:grid-cols-2">
          <Input label={t('auth.register.companyName')} placeholder="Демо цех" />
          <Input label={t('auth.register.city')} error={t('validation.required')} />
          <PasswordInput label={t('auth.login.password')} hint={t('auth.register.passwordHint')} />
          <PhoneInput label={t('auth.login.phone')} value={phone} onChange={setPhone} />
          <CodeInput label={t('auth.otp.code')} />
          <Select
            label={t('auth.register.employeeRole')}
            options={['SEWER', 'CUTTER', 'FOREMAN'].map((r) => ({
              value: r,
              label: t(`roles.${r}`),
            }))}
          />
          <Textarea label={t('landing.about.title')} containerClassName="md:col-span-2" />
          <Checkbox label={t('auth.register.acceptTerms')} />
          <Checkbox label={t('auth.register.acceptTerms')} error={t('validation.terms')} />
        </div>
      </Demo>

      <Demo name="Badge / StatusBadge">
        <div className="flex flex-wrap gap-2">
          {OrderStatusSchema.options.map((s) => (
            <StatusBadge key={s} status={s} />
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge>{t('common.stage', { stage: 2 })}</Badge>
          <Badge tone="primary">primary</Badge>
          <Badge tone="success">success</Badge>
          <Badge tone="warning">warning</Badge>
          <Badge tone="danger">danger</Badge>
          <Badge tone="dark">dark</Badge>
        </div>
      </Demo>

      <Demo name="StatCard">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t('landing.hero.mockToday')}
            value="1 240"
            hint={t('landing.hero.pcs')}
          />
          <StatCard label={t('landing.hero.mockActive')} value="12" />
          <StatCard label={t('landing.hero.mockRisk')} value="2" tone="danger" />
          <StatCard
            label={t('landing.hero.mockPayroll')}
            value={formatMoney(48_560_00)}
            tone="dark"
            icon={<Wallet className="size-4" aria-hidden="true" />}
          />
        </div>
      </Demo>

      <Demo name="ProgressBar">
        <Card className="flex flex-col gap-3">
          <ProgressBar value={72} label="primary" showValue />
          <ProgressBar value={88} tone="success" label="success" showValue />
          <ProgressBar value={55} tone="warning" label="warning" showValue />
          <ProgressBar value={30} tone="danger" label="danger" showValue size="md" />
        </Card>
      </Demo>

      <Demo name="Alert">
        <Alert tone="danger" title={t('errors.ALREADY_DONE')}>
          {t('ui.operation.doneBy', { name: 'Айгүл Токтогулова', time: '14:32' })}
        </Alert>
        <Alert tone="warning">{t('errors.LOCKED')}</Alert>
        <Alert tone="success">{t('landing.lead.success')}</Alert>
        <Alert
          tone="info"
          action={
            <Button size="sm" variant="secondary">
              {t('common.retry')}
            </Button>
          }
        >
          {t('errors.NETWORK_ERROR')}
        </Alert>
      </Demo>

      <Demo name="Tabs / Table">
        <Tabs
          label={t('nav.orders')}
          value={tab}
          onChange={setTab}
          items={[
            { id: 'all', label: t('common.total'), count: 3 },
            { id: 'SEWING', label: t('orders.status.SEWING'), count: 2 },
            { id: 'NEW', label: t('orders.status.NEW'), count: 1 },
          ]}
        />
        <Table
          caption={t('nav.orders')}
          rows={DEMO_ORDERS.filter((o) => tab === 'all' || o.status === tab)}
          rowKey={(o) => o.id}
          rowClassName={(o) => (o.late ? 'row-danger' : undefined)}
          columns={[
            { key: 'n', header: '№', render: (o) => <span className="num">{o.number}</span> },
            { key: 'c', header: t('roles.CLIENT'), render: (o) => o.customer },
            {
              key: 'q',
              header: t('landing.hero.pcs'),
              align: 'right',
              render: (o) => <span className="num">{o.qty}</span>,
            },
            {
              key: 'p',
              header: '%',
              className: 'w-48',
              render: (o) => (
                <ProgressBar
                  value={o.progress}
                  tone={o.late ? 'danger' : 'primary'}
                  label={o.number}
                  showValue
                />
              ),
            },
            {
              key: 'd',
              header: '',
              render: (o) => <span className="num">{formatDate(o.deadline)}</span>,
            },
            { key: 's', header: '', render: (o) => <StatusBadge status={o.status} /> },
          ]}
        />
      </Demo>

      <Demo name="Modal / Toast">
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Modal
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.show({ tone: 'success', title: t('landing.lead.success') })}
          >
            Toast success
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.show({ tone: 'danger', title: t('errors.NETWORK_ERROR') })}
          >
            Toast danger
          </Button>
        </div>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={t('auth.otp.title')}
          footer={
            <>
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={() => setModalOpen(false)}>{t('common.save')}</Button>
            </>
          }
        >
          <PhoneInput label={t('auth.login.phone')} value={phone} onChange={setPhone} />
        </Modal>
      </Demo>

      <Demo name="EmptyState / Skeleton / FileDrop">
        <div className="grid gap-4 md:grid-cols-2">
          <Card padded={false}>
            <EmptyState
              title={t('common.emptyTitle')}
              action={<Button size="sm">{t('nav.ordersCreate')}</Button>}
            />
          </Card>
          <Card className="flex flex-col gap-4">
            <Skeleton className="h-8 w-1/2" />
            <SkeletonText lines={4} />
          </Card>
        </div>
        <FileDrop
          label={t('auth.register.modelImport')}
          accept={['.pdf', '.jpg', '.png', '.dxf']}
          maxSizeMb={20}
          multiple
          files={files}
          onChange={setFiles}
        />
      </Demo>

      <Demo name="ScanButton / OfflineBadge / OperationOption / PinPad">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="flex flex-wrap justify-center gap-2">
              <OfflineBadge online queued={0} />
              <OfflineBadge online={false} queued={7} />
              <OfflineBadge online queued={3} />
            </div>
            <ScanButton />
          </div>
          <div className="flex flex-col gap-3">
            <OperationOption
              name="op"
              value="op-1"
              seq={1}
              title="Ийин тигүү"
              priceTiyin={8_00}
              qty={20}
              checked={false}
              onChange={setOperation}
              state={{ kind: 'doneBy', name: 'Айгүл Токтогулова', at: '2026-10-17T08:32:00Z' }}
            />
            <OperationOption
              name="op"
              value="op-2"
              seq={2}
              title="Жака кошуу"
              priceTiyin={6_50}
              qty={20}
              checked={false}
              onChange={setOperation}
              state={{ kind: 'doneByMe', at: '2026-10-17T09:10:00Z' }}
            />
            <OperationOption
              name="op"
              value="op-3"
              seq={3}
              title="Жең кошуу"
              priceTiyin={8_00}
              qty={20}
              checked={operation === 'op-3'}
              onChange={setOperation}
              state={{ kind: 'available' }}
            />
            <OperationOption
              name="op"
              value="op-4"
              seq={4}
              title="Каптал тигиш"
              priceTiyin={7_00}
              qty={20}
              checked={operation === 'op-4'}
              onChange={setOperation}
              state={{ kind: 'available' }}
            />
            <Button size="xl" fullWidth>
              {t('common.continue')} · {formatMoney(160_00)}
            </Button>
          </div>
          <div className="flex justify-center">
            <PinPad value={pin} onChange={setPin} />
          </div>
        </div>
      </Demo>
    </div>
  );
}
