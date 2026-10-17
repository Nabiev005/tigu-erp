import { Delete } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';

export interface PinPadProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'] as const;

/** 4 dots + large 72px keys (spec §9, 1.2). Also accepts the physical keyboard. */
export function PinPad({
  value,
  onChange,
  length = 4,
  disabled = false,
  error = false,
}: PinPadProps) {
  const { t } = useTranslation();

  const press = (key: string) => {
    if (disabled) return;
    if (key === 'back') onChange(value.slice(0, -1));
    else if (value.length < length) onChange(value + key);
  };

  useEffect(() => {
    if (disabled) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key) && value.length < length) onChange(value + e.key);
      else if (e.key === 'Backspace') onChange(value.slice(0, -1));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [disabled, value, length, onChange]);

  return (
    <div className="flex flex-col items-center gap-8">
      <div
        className="flex gap-4"
        role="status"
        aria-label={t('ui.pinPad.entered', { count: value.length })}
      >
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className={cn(
              'size-4 rounded-full border-2 transition-colors',
              error
                ? 'border-danger bg-danger'
                : i < value.length
                  ? 'border-ink bg-ink'
                  : 'border-line bg-surface',
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {KEYS.map((key) =>
          key === '' ? (
            <span key="spacer" />
          ) : (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => press(key)}
              aria-label={key === 'back' ? t('ui.pinPad.backspace') : key}
              className={cn(
                'flex size-pin-key items-center justify-center rounded-full text-worker-title num transition-colors',
                'disabled:opacity-40',
                key === 'back'
                  ? 'text-muted hover:bg-line-soft'
                  : 'border border-line bg-surface hover:bg-line-soft active:bg-line',
              )}
            >
              {key === 'back' ? <Delete className="size-7" aria-hidden="true" /> : key}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
