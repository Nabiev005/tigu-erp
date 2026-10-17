import { describe, expect, it } from 'vitest';
import { formatMinor, formatPhone, maskPhone } from './format';

const NBSP = ' ';
const s = (text: string) => text.replaceAll(' ', NBSP);

describe('formatMinor', () => {
  it('formats whole som with thousands separator', () => {
    expect(formatMinor(1240_00)).toBe(s('1 240 сом'));
    expect(formatMinor(0)).toBe(s('0 сом'));
    expect(formatMinor(1_234_567_00)).toBe(s('1 234 567 сом'));
  });

  it('shows tiyin when present', () => {
    expect(formatMinor(1240_50)).toBe(s('1 240,50 сом'));
    expect(formatMinor(8)).toBe(s('0,08 сом'));
  });

  it('always shows decimals for payroll sheets', () => {
    expect(formatMinor(1240_00, { fraction: 'always', withCurrency: false })).toBe(s('1 240,00'));
  });

  it('supports negative amounts and other currencies', () => {
    expect(formatMinor(-500_00)).toBe(s('−500 сом'));
    expect(formatMinor(99_00, { currency: 'USD' })).toBe(s('99 $'));
  });

  it('rejects non-integer money', () => {
    expect(() => formatMinor(10.5)).toThrow(RangeError);
  });
});

describe('phone formatting', () => {
  it('masks phone numbers', () => {
    expect(maskPhone('+996555123456')).toBe('+996 555 •• •• 56');
  });

  it('pretty-prints Kyrgyz numbers', () => {
    expect(formatPhone('+996555123456')).toBe('+996 555 123 456');
  });
});
