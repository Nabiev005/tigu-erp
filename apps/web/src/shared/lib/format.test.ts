import { describe, expect, it } from 'vitest';
import { formatDate, formatDateTime, formatTime } from './formatDate';
import { formatMoney } from './formatMoney';

describe('formatMoney', () => {
  it('formats tiyin as som with a space between thousands', () => {
    expect(formatMoney(1240_00)).toBe('1 240 сом');
  });
});

describe('formatDate', () => {
  // 2026-10-08 08:32 UTC = 14:32 in Asia/Bishkek (UTC+6)
  const iso = '2026-10-08T08:32:00Z';

  it('uses dd.mm.yyyy in the tenant timezone', () => {
    expect(formatDate(iso)).toBe('08.10.2026');
  });

  it('uses 24h time in the tenant timezone', () => {
    expect(formatTime(iso)).toBe('14:32');
    expect(formatDateTime(iso)).toBe('08.10.2026 14:32');
  });

  it('rolls the date over at local midnight', () => {
    expect(formatDate('2026-10-08T19:00:00Z')).toBe('09.10.2026');
  });
});
