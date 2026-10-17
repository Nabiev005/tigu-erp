// Server works in UTC; screens show the tenant's timezone (spec §8).
const DEFAULT_TZ = 'Asia/Bishkek';

function parts(value: Date | string, timeZone: string, options: Intl.DateTimeFormatOptions) {
  const date = typeof value === 'string' ? new Date(value) : value;
  const map: Record<string, string> = {};
  for (const p of new Intl.DateTimeFormat('en-GB', { timeZone, ...options }).formatToParts(date)) {
    map[p.type] = p.value;
  }
  return map;
}

/** "08.10.2026" */
export function formatDate(value: Date | string, timeZone = DEFAULT_TZ): string {
  const p = parts(value, timeZone, { day: '2-digit', month: '2-digit', year: 'numeric' });
  return `${p.day}.${p.month}.${p.year}`;
}

/** "14:32" */
export function formatTime(value: Date | string, timeZone = DEFAULT_TZ): string {
  const p = parts(value, timeZone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return `${p.hour}:${p.minute}`;
}

/** "08.10.2026 14:32" */
export function formatDateTime(value: Date | string, timeZone = DEFAULT_TZ): string {
  return `${formatDate(value, timeZone)} ${formatTime(value, timeZone)}`;
}
