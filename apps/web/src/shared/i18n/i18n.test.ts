import { describe, expect, it } from 'vitest';
import ky from './ky.json';
import ru from './ru.json';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

function keys(value: Json, prefix = ''): string[] {
  if (Array.isArray(value)) return value.flatMap((v, i) => keys(v, `${prefix}[${i}]`));
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([k, v]) => keys(v, prefix ? `${prefix}.${k}` : k));
  }
  return [prefix];
}

describe('translations', () => {
  it('ky and ru have exactly the same keys', () => {
    expect(keys(ru as Json).sort()).toEqual(keys(ky as Json).sort());
  });
});
