import { CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { formatTime } from '../../lib/formatDate';
import { formatMoney } from '../../lib/formatMoney';

export type OperationState =
  | { kind: 'available' }
  | { kind: 'doneBy'; name: string; at: string }
  | { kind: 'doneByMe'; at: string };

export interface OperationOptionProps {
  name: string;
  value: string;
  seq: number;
  title: string;
  priceTiyin: number;
  qty: number;
  state: OperationState;
  checked: boolean;
  onChange: (value: string) => void;
}

/** Radio row for picking an operation on the scan screen (spec §9, 3.2). Height ≥ 64px. */
export function OperationOption({
  name,
  value,
  seq,
  title,
  priceTiyin,
  qty,
  state,
  checked,
  onChange,
}: OperationOptionProps) {
  const { t } = useTranslation();
  const done = state.kind !== 'available';

  return (
    <label
      className={cn(
        'flex min-h-control-xl items-center gap-3 rounded-phone-card border-2 px-4 py-3 transition-colors',
        done
          ? 'border-line bg-line-soft text-muted'
          : checked
            ? 'border-primary bg-primary-soft'
            : 'border-line bg-surface',
        !done && 'cursor-pointer',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={done}
        onChange={() => onChange(value)}
        className="size-6 shrink-0 accent-primary"
      />
      <span className="w-6 shrink-0 text-caption text-muted num">{seq}</span>
      <span className="min-w-0 flex-1">
        <span className={cn('block text-worker font-medium', done && 'line-through')}>{title}</span>
        {state.kind === 'doneBy' ? (
          <span className="block text-caption">
            {t('ui.operation.doneBy', { name: state.name, time: formatTime(state.at) })}
          </span>
        ) : state.kind === 'doneByMe' ? (
          <span className="flex items-center gap-1 text-caption text-success-text">
            <CheckCircle2 className="size-3.5" aria-hidden="true" />
            {t('ui.operation.doneByMe', { time: formatTime(state.at) })}
          </span>
        ) : null}
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-caption text-muted num">
          {formatMoney(priceTiyin)} × {qty}
        </span>
        <span className={cn('block text-worker num', done && 'line-through')}>
          {formatMoney(priceTiyin * qty)}
        </span>
      </span>
    </label>
  );
}
