import type { OrderStatus } from '@tigu/shared';
import { useTranslation } from 'react-i18next';
import { Badge, type BadgeTone } from './Badge';

// Spec §10. CANCELLED is not specified in the design; danger-soft keeps it distinct.
const STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  NEW: 'neutral',
  CUTTING: 'soft',
  SEWING: 'primary',
  QC: 'warning',
  PACKING: 'success',
  SHIPPED: 'dark',
  CANCELLED: 'danger',
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const { t } = useTranslation();
  return (
    <Badge tone={STATUS_TONE[status]} className={className} data-status={status}>
      {t(`orders.status.${status}`)}
    </Badge>
  );
}
