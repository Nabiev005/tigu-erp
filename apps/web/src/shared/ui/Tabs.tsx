import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
  count?: number;
}

export interface TabsProps<T extends string> {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  /** Used to link tabs with their panels: `${idBase}-panel-${id}`. */
  idBase?: string;
  variant?: 'line' | 'pill';
  className?: string;
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  idBase,
  variant = 'line',
  className,
}: TabsProps<T>) {
  const autoId = useId();
  const base = idBase ?? autoId;
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKeyDown = (e: KeyboardEvent, index: number) => {
    const delta = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    e.preventDefault();
    const next = (index + delta + items.length) % items.length;
    const item = items[next];
    if (!item) return;
    onChange(item.id);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'flex overflow-x-auto',
        variant === 'line'
          ? 'gap-4 border-b border-line'
          : 'gap-1 rounded-control bg-line-soft p-1',
        className,
      )}
    >
      {items.map((item, index) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            role="tab"
            type="button"
            id={`${base}-tab-${item.id}`}
            aria-selected={selected}
            aria-controls={`${base}-panel-${item.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={cn(
              'inline-flex min-h-control shrink-0 items-center gap-2 text-body font-medium whitespace-nowrap transition-colors',
              variant === 'line'
                ? cn(
                    '-mb-px border-b-2 px-1',
                    selected
                      ? 'border-primary text-ink'
                      : 'border-transparent text-muted hover:text-ink',
                  )
                : cn(
                    'flex-1 justify-center rounded-control px-3',
                    selected ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink',
                  ),
            )}
          >
            {item.label}
            {item.count !== undefined ? (
              <span className="rounded-full bg-line-soft px-1.5 text-caption num">
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({
  idBase,
  id,
  children,
  className,
}: {
  idBase: string;
  id: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="tabpanel"
      id={`${idBase}-panel-${id}`}
      aria-labelledby={`${idBase}-tab-${id}`}
      className={className}
    >
      {children}
    </div>
  );
}
