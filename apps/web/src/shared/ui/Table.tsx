import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  render: (row: T) => ReactNode;
  align?: 'left' | 'right' | 'center';
  className?: string;
}

export interface TableProps<T> {
  columns: readonly TableColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  caption?: string;
  rowClassName?: (row: T) => string | undefined;
  footer?: ReactNode;
  empty?: ReactNode;
  className?: string;
}

const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

/** Data table; scrolls horizontally on narrow screens. */
export function Table<T>({
  columns,
  rows,
  rowKey,
  caption,
  rowClassName,
  footer,
  empty,
  className,
}: TableProps<T>) {
  return (
    <div className={cn('overflow-x-auto rounded-card border border-line bg-surface', className)}>
      <table className="w-full min-w-max border-collapse text-body">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-line">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  'h-10 px-4 text-caption font-medium text-muted',
                  ALIGN[col.align ?? 'left'],
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && empty ? (
            <tr>
              <td colSpan={columns.length} className="p-0">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={cn('border-b border-line-soft last:border-b-0', rowClassName?.(row))}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('h-12 px-4 py-2', ALIGN[col.align ?? 'left'], col.className)}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {footer ? (
          <tfoot className="border-t border-line bg-paper font-semibold">{footer}</tfoot>
        ) : null}
      </table>
    </div>
  );
}
