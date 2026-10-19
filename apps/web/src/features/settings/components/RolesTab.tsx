import { RoleSchema, SECTIONS, canAccessSection } from '@tigu/shared';
import { Check, Minus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader } from '../../../shared/ui';

/** Read-only view of the shared permissions matrix (packages/shared/src/permissions.ts). */
export function RolesTab() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <Card padded={false}>
        <div className="p-4 sm:p-6">
          <CardHeader title={t('settings.roles.title')} className="mb-1" />
          <p className="text-body text-muted">{t('settings.roles.text')}</p>
        </div>
        <div className="overflow-x-auto border-t border-line">
          <table className="w-full min-w-max border-collapse text-body">
            <caption className="sr-only">{t('settings.roles.title')}</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="h-10 px-4 text-left text-caption font-medium text-muted">
                  {t('settings.roles.section')}
                </th>
                {RoleSchema.options.map((role) => (
                  <th
                    key={role}
                    scope="col"
                    className="h-10 px-3 text-center text-caption font-medium text-muted"
                  >
                    {t(`roles.${role}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SECTIONS.map((section) => (
                <tr key={section} className="border-b border-line-soft last:border-b-0">
                  <th scope="row" className="h-11 px-4 text-left font-medium">
                    {t(`nav.${section}`)}
                  </th>
                  {RoleSchema.options.map((role) => {
                    const allowed = canAccessSection(role, section);
                    return (
                      <td key={role} className="px-3 text-center">
                        {allowed ? (
                          <Check
                            className="mx-auto size-4 text-success"
                            aria-label={t('settings.roles.allowed')}
                          />
                        ) : (
                          <Minus
                            className="mx-auto size-4 text-line"
                            aria-label={t('settings.roles.denied')}
                          />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card>
        <CardHeader title={t('settings.roles.extraTitle')} className="mb-1" />
        <p className="text-body text-muted">{t('settings.roles.extraText')}</p>
      </Card>
    </div>
  );
}
