import { formatMinor, type Currency } from '@tigu/shared';

/** `formatMoney(1240_00)` → "1 240 сом". Amount is in tiyin (integer). */
export function formatMoney(minor: number, currency: Currency = 'KGS'): string {
  return formatMinor(minor, { currency });
}
