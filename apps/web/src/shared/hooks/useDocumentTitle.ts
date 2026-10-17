import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export function useDocumentTitle(title: string): void {
  const { t } = useTranslation();
  const appName = t('app.name');
  useEffect(() => {
    document.title = title && title !== appName ? `${title} · ${appName}` : appName;
  }, [title, appName]);
}
