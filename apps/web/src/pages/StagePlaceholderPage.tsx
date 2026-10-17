import type { Section } from '@tigu/shared';
import { Construction } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useDocumentTitle } from '../shared/hooks/useDocumentTitle';
import { Card, EmptyState } from '../shared/ui';

/** Route target for screens built in later stages. */
export function StagePlaceholderPage({ section, stage }: { section: Section; stage: number }) {
  const { t } = useTranslation();
  const title = t(`nav.${section}`);
  useDocumentTitle(title);
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-h1">{title}</h1>
      <Card>
        <EmptyState
          icon={<Construction className="size-6" aria-hidden="true" />}
          title={t('placeholder.title', { stage })}
          text={t('placeholder.text')}
        />
      </Card>
    </div>
  );
}
