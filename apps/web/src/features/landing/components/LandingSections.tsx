import type { Role } from '@tigu/shared';
import {
  BarChart3,
  Check,
  ChevronDown,
  ClipboardList,
  Factory,
  FileSpreadsheet,
  type LucideIcon,
  MessageSquare,
  Printer,
  QrCode,
  Scissors,
  Send,
  ShieldCheck,
  Shirt,
  Users,
  Wallet,
  Warehouse,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { paths } from '../../../shared/config/routes';
import { cn } from '../../../shared/lib/cn';
import { Badge, Card, buttonClasses } from '../../../shared/ui';
import { LeadForm } from '../../leads';
import { useList } from '../useList';
import { Section } from './Section';

export function ProblemsSection() {
  const { t } = useTranslation();
  const items = useList<{ problem: string; solution: string }>('landing.problems.items');
  return (
    <Section id="features" title={t('landing.problems.title')}>
      <div className="grid gap-4 md:grid-cols-2">
        {items.map((item) => (
          <Card key={item.problem} className="flex flex-col gap-4">
            <div>
              <Badge tone="danger">{t('landing.problems.problemLabel')}</Badge>
              <p className="mt-2 text-worker text-body-2">{item.problem}</p>
            </div>
            <div className="border-t border-line-soft pt-4">
              <Badge tone="success">{t('landing.problems.solutionLabel')}</Badge>
              <p className="mt-2 text-worker font-medium">{item.solution}</p>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export function HowSection() {
  const { t } = useTranslation();
  const steps = useList<{ title: string; text: string }>('landing.how.steps');
  return (
    <Section id="how" title={t('landing.how.title')} tone="surface">
      <ol className="grid gap-6 md:grid-cols-5 md:gap-4">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4 md:flex-col">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-ink text-surface num">
              {index + 1}
            </span>
            <div>
              <p className="text-h2">{step.title}</p>
              <p className="mt-1 text-body text-muted">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}

const MODULES: { key: string; icon: LucideIcon; soon?: boolean }[] = [
  { key: 'orders', icon: ClipboardList },
  { key: 'techCards', icon: Shirt },
  { key: 'cutting', icon: Scissors },
  { key: 'scanning', icon: QrCode },
  { key: 'production', icon: Factory },
  { key: 'payroll', icon: Wallet },
  { key: 'reports', icon: BarChart3 },
  { key: 'warehouse', icon: Warehouse, soon: true },
  { key: 'quality', icon: ShieldCheck, soon: true },
  { key: 'portal', icon: Users, soon: true },
];

const ROLE_ORDER: Role[] = ['OWNER', 'TECHNOLOGIST', 'FOREMAN', 'SEWER', 'ACCOUNTANT', 'CLIENT'];

export function ModulesSection() {
  const { t } = useTranslation();
  return (
    <Section title={t('landing.modules.title')}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {MODULES.map(({ key, icon: Icon, soon }) => (
          <Card key={key} className="flex flex-col gap-3 p-4 sm:p-4">
            <div className="flex items-center justify-between">
              <Icon className="size-6 text-primary" aria-hidden="true" />
              {soon ? <Badge tone="soft">{t('common.soon')}</Badge> : null}
            </div>
            <div>
              <p className="font-semibold">{t(`landing.modules.items.${key}.title`)}</p>
              <p className="mt-1 text-caption text-muted">
                {t(`landing.modules.items.${key}.text`)}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <h3 className="mt-16 mb-6 text-h1">{t('landing.roles.title')}</h3>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ROLE_ORDER.map((role) => (
          <li key={role} className="rounded-card border border-line bg-surface p-4">
            <p className="font-semibold">{t(`roles.${role}`)}</p>
            <p className="mt-1 text-body text-muted">{t(`landing.roles.items.${role}`)}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function NumbersSection() {
  const { t } = useTranslation();
  const items = useList<{ value: string; label: string }>('landing.numbers.items');
  return (
    <Section title={t('landing.numbers.title')} tone="ink">
      <dl className="grid grid-cols-2 gap-8 md:grid-cols-5">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col-reverse gap-1">
            <dt className="text-body opacity-70">{item.label}</dt>
            <dd className="text-h1 num sm:text-section">{item.value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

const INTEGRATIONS: { key: string; icon: LucideIcon }[] = [
  { key: 'telegram', icon: Send },
  { key: 'excel', icon: FileSpreadsheet },
  { key: 'sms', icon: MessageSquare },
  { key: 'printers', icon: Printer },
];

export function TrustSection() {
  const { t } = useTranslation();
  const simple = useList<string>('landing.trust.simple');
  const secure = useList<string>('landing.trust.secure');
  return (
    <Section title={t('landing.trust.title')}>
      <div className="grid gap-4 md:grid-cols-2">
        <CheckList title={t('landing.trust.simpleTitle')} items={simple} />
        <CheckList title={t('landing.trust.secureTitle')} items={secure} />
      </div>

      <h3 className="mt-16 mb-6 text-h1">{t('landing.integrations.title')}</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {INTEGRATIONS.map(({ key, icon: Icon }) => (
          <Card key={key} className="flex gap-3 p-4 sm:p-4">
            <Icon className="size-6 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="font-semibold">{t(`landing.integrations.items.${key}.title`)}</p>
              <p className="mt-1 text-caption text-muted">
                {t(`landing.integrations.items.${key}.text`)}
              </p>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-4 text-body text-muted">{t('landing.integrations.soon')}</p>
    </Section>
  );
}

function CheckList({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <p className="text-h2">{title}</p>
      <ul className="mt-4 flex flex-col gap-3">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-body">
            <Check className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
            {item}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function PricingSection() {
  const { t } = useTranslation();
  const plans = useList<{ name: string; text: string }>('landing.pricing.plans');
  return (
    <Section id="pricing" title={t('landing.pricing.title')} tone="surface">
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan, index) => {
          const popular = index === 1;
          return (
            <div
              key={plan.name}
              className={cn(
                'flex flex-col gap-4 rounded-card border p-6',
                popular ? 'border-primary bg-primary-soft' : 'border-line bg-paper',
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-h2">{plan.name}</p>
                {popular ? <Badge tone="primary">{t('landing.pricing.popular')}</Badge> : null}
              </div>
              <p>
                <span className="text-h1 num">{t('landing.pricing.price')}</span>{' '}
                <span className="text-body text-muted">{t('landing.pricing.perMonth')}</span>
              </p>
              <p className="flex-1 text-body text-muted">{plan.text}</p>
              <Link
                to={paths.register}
                className={buttonClasses({
                  variant: popular ? 'primary' : 'secondary',
                  fullWidth: true,
                })}
              >
                {t('landing.pricing.cta')}
              </Link>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

export function AboutFaqSection() {
  const { t } = useTranslation();
  const faq = useList<{ q: string; a: string }>('landing.faq.items');
  return (
    <Section id="about">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="text-h1 sm:text-section">{t('landing.about.title')}</h2>
          <p className="mt-4 text-worker text-body-2">{t('landing.about.text')}</p>
          <p className="mt-4 text-body text-muted">{t('landing.about.company')}</p>
        </div>
        <div>
          <h2 className="mb-4 text-h1">{t('landing.faq.title')}</h2>
          <div className="flex flex-col gap-2">
            {faq.map((item) => (
              <details
                key={item.q}
                className="group rounded-card border border-line bg-surface open:shadow-card"
              >
                <summary className="flex min-h-touch cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
                  {item.q}
                  <ChevronDown
                    className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180"
                    aria-hidden="true"
                  />
                </summary>
                <p className="px-4 pb-4 text-body text-body-2">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

export function LeadSection() {
  const { t } = useTranslation();
  return (
    <Section id="contact" tone="surface">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-h1 sm:text-section">{t('landing.lead.title')}</h2>
          <p className="mt-4 text-worker text-body-2">{t('landing.lead.subtitle')}</p>
        </div>
        <Card className="bg-paper">
          <LeadForm />
        </Card>
      </div>
    </Section>
  );
}
