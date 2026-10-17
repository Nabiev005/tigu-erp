import { QrCode } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { paths } from '../../../shared/config/routes';
import { formatMoney } from '../../../shared/lib/formatMoney';
import { Badge, ProgressBar, StatusBadge, buttonClasses } from '../../../shared/ui';

// Demo figures for the illustration only.
const DEMO_ORDERS = [
  { number: 'Б-0142', model: 'FT-210', progress: 72, status: 'SEWING', tone: 'primary' },
  { number: 'Б-0139', model: 'HD-044', progress: 45, status: 'SEWING', tone: 'danger' },
  { number: 'Б-0145', model: 'PN-118', progress: 18, status: 'CUTTING', tone: 'primary' },
] as const;

export function Hero() {
  const { t } = useTranslation();
  return (
    <section className="overflow-hidden px-4 pt-10 pb-16 sm:px-8 sm:pt-16 sm:pb-24">
      <div className="mx-auto grid max-w-content items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <Badge tone="primary">{t('landing.hero.eyebrow')}</Badge>
          <h1 className="mt-4 text-h1 sm:text-display">{t('landing.hero.title')}</h1>
          <p className="mt-4 max-w-xl text-worker text-body-2">{t('landing.hero.subtitle')}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to={paths.register} className={buttonClasses({ size: 'md' })}>
              {t('landing.hero.ctaPrimary')}
            </Link>
            <a href="#how" className={buttonClasses({ variant: 'secondary', size: 'md' })}>
              {t('landing.hero.ctaSecondary')}
            </a>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:pb-8" aria-hidden="true">
          {/* Admin dashboard mockup */}
          <div className="hidden overflow-hidden rounded-card border border-line bg-surface shadow-overlay sm:flex">
            <div className="flex w-14 shrink-0 flex-col gap-3 bg-ink p-3">
              {Array.from({ length: 6 }, (_, i) => (
                <span
                  key={i}
                  className={i === 1 ? 'h-2 rounded-full bg-surface' : 'h-2 rounded-full bg-ink-2'}
                />
              ))}
            </div>
            <div className="flex-1 p-4">
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <MiniStat label={t('landing.hero.mockToday')} value="1 240" />
                <MiniStat label={t('landing.hero.mockActive')} value="12" />
                <MiniStat label={t('landing.hero.mockRisk')} value="2" danger />
                <MiniStat label={t('landing.hero.mockPayroll')} value={formatMoney(48_560_00)} />
              </div>
              <p className="mt-4 mb-2 text-caption font-semibold">{t('landing.hero.mockOrders')}</p>
              <ul className="flex flex-col divide-y divide-line-soft">
                {DEMO_ORDERS.map((o) => (
                  <li key={o.number} className="flex items-center gap-3 py-2 text-caption">
                    <span className="w-14 num">{o.number}</span>
                    <span className="w-14 text-muted num">{o.model}</span>
                    <ProgressBar
                      value={o.progress}
                      tone={o.tone}
                      label={o.number}
                      className="flex-1"
                      showValue
                    />
                    <StatusBadge status={o.status} />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sewer phone mockup */}
          <div className="mx-auto w-56 rounded-device border-6 border-ink bg-paper p-3 shadow-overlay sm:absolute sm:-right-2 sm:-bottom-10 sm:mx-0 sm:w-48">
            <p className="text-caption font-semibold">{t('landing.hero.mockGreeting')}</p>
            <div className="mt-2 rounded-phone-card bg-ink p-3 text-surface">
              <p className="text-caption opacity-80">{t('landing.hero.mockEarned')}</p>
              <p className="text-h2 num">{formatMoney(1_240_00)}</p>
            </div>
            <div className="my-5 flex justify-center">
              <span className="flex size-24 items-center justify-center rounded-full bg-primary text-surface ring-8 ring-primary-ring">
                <QrCode className="size-10" strokeWidth={1.5} />
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div
      className={
        danger
          ? 'rounded-control border border-danger bg-danger-soft p-2 text-danger-text'
          : 'rounded-control border border-line p-2'
      }
    >
      <p className="truncate text-micro opacity-80">{label}</p>
      <p className="mt-1 text-body num">{value}</p>
    </div>
  );
}
