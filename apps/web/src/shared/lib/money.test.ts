import { describe, expect, it } from 'vitest';
import { somInputToTiyin, tiyinToSomInput } from './money';

describe('som input', () => {
  it('converts whole som with spaces into tiyin', () => {
    expect(somInputToTiyin('40 000')).toBe(4_000_000);
    expect(somInputToTiyin('0')).toBe(0);
  });

  it('rejects empty, negative and fractional input', () => {
    expect(somInputToTiyin('')).toBeNull();
    expect(somInputToTiyin('-5')).toBeNull();
    expect(somInputToTiyin('12,50')).toBeNull();
  });

  it('round-trips tiyin back to an editable value', () => {
    expect(tiyinToSomInput(4_000_000)).toBe('40000');
    expect(tiyinToSomInput(null)).toBe('');
  });
});
