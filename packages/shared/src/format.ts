import type { Currency } from './enums';

const NBSP = ' ';

const CURRENCY_SUFFIX: Record<Currency, string> = {
  KGS: 'сом',
  RUB: '₽',
  KZT: '₸',
  USD: '$',
};

function groupThousands(value: bigint): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

export interface FormatMinorOptions {
  currency?: Currency;
  /** 'auto' hides ",00" for whole amounts; 'always' prints two decimals (payroll sheets). */
  fraction?: 'auto' | 'always';
  /** Append the currency sign. Default true. */
  withCurrency?: boolean;
}

/**
 * Formats an integer amount in minor units (tiyin): 124000 → "1 240 сом", 124050 → "1 240,50 сом".
 * Integer arithmetic only — money never passes through floats.
 */
export function formatMinor(minor: number, options: FormatMinorOptions = {}): string {
  if (!Number.isSafeInteger(minor)) throw new RangeError(`Money must be an integer, got ${minor}`);
  const { currency = 'KGS', fraction = 'auto', withCurrency = true } = options;
  const negative = minor < 0;
  const abs = BigInt(Math.abs(minor));
  const whole = abs / 100n;
  const cents = abs % 100n;
  let text = groupThousands(whole);
  if (fraction === 'always' || cents !== 0n) text += `,${cents.toString().padStart(2, '0')}`;
  if (negative) text = `−${text}`;
  return withCurrency ? `${text}${NBSP}${CURRENCY_SUFFIX[currency]}` : text;
}

/** Masks a phone for lists: +996555123456 → "+996 555 •• •• 56". */
export function maskPhone(phone: string): string {
  const match = /^\+996(\d{3})\d{4}(\d{2})$/.exec(phone);
  if (match) return `+996 ${match[1]} •• •• ${match[2]}`;
  return phone.length > 6 ? `${phone.slice(0, 4)} •• •• ${phone.slice(-2)}` : phone;
}

/** Pretty-prints a Kyrgyz number: +996555123456 → "+996 555 123 456". */
export function formatPhone(phone: string): string {
  const match = /^\+996(\d{3})(\d{3})(\d{3})$/.exec(phone);
  return match ? `+996 ${match[1]} ${match[2]} ${match[3]}` : phone;
}
