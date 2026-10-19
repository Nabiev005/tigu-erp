/**
 * Converts a whole-som amount typed by a user ("40 000") into tiyin. Integer-only:
 * money never goes through floats (spec §1.4). Returns null for empty or invalid input.
 */
export function somInputToTiyin(value: string): number | null {
  // `\s` also covers the non-breaking space that formatMoney produces.
  const digits = value.replace(/\s/g, '');
  if (!/^\d{1,9}$/.test(digits)) return null;
  return Number(digits) * 100;
}

/** Tiyin → editable whole-som string (drops kopecks, which salaries do not use). */
export function tiyinToSomInput(tiyin: number | null | undefined): string {
  return tiyin === null || tiyin === undefined ? '' : String(Math.trunc(tiyin / 100));
}
