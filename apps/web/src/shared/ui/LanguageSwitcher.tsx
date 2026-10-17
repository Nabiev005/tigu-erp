import { LocaleSchema } from '@tigu/shared';
import { useTranslation } from 'react-i18next';
import { setLocale } from '../i18n';
import { cn } from '../lib/cn';

export function LanguageSwitcher({
  tone = 'light',
  className,
}: {
  tone?: 'light' | 'dark';
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  return (
    <div
      role="group"
      aria-label={t('locale.label')}
      className={cn(
        'inline-flex rounded-control p-0.5',
        tone === 'light' ? 'bg-line-soft' : 'bg-ink-2',
        className,
      )}
    >
      {LocaleSchema.options.map((locale) => {
        const active = i18n.language === locale;
        return (
          <button
            key={locale}
            type="button"
            aria-pressed={active}
            onClick={() => setLocale(locale)}
            className={cn(
              'h-8 min-w-11 rounded-control px-2 text-caption font-semibold transition-colors',
              tone === 'light'
                ? active
                  ? 'bg-surface text-ink shadow-card'
                  : 'text-muted hover:text-ink'
                : active
                  ? 'bg-surface text-ink'
                  : 'text-line hover:text-surface',
            )}
          >
            {t(`locale.${locale}`)}
          </button>
        );
      })}
    </div>
  );
}
