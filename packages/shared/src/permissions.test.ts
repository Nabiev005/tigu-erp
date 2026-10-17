import { describe, expect, it } from 'vitest';
import { RoleSchema } from './enums';
import { canAccessSection, hasPermission, ROLE_HOME, SECTION_ACCESS } from './permissions';

describe('permissions matrix', () => {
  it('lets OWNER into every admin section but not worker or portal screens', () => {
    for (const [section, roles] of Object.entries(SECTION_ACCESS)) {
      const workerOrPortal = ['scan', 'earnings', 'history', 'portal'].includes(section);
      expect(roles.includes('OWNER')).toBe(!workerOrPortal);
    }
  });

  it('keeps SEWER out of payroll and settings', () => {
    expect(canAccessSection('SEWER', 'payroll')).toBe(false);
    expect(canAccessSection('SEWER', 'settings')).toBe(false);
    expect(canAccessSection('SEWER', 'earnings')).toBe(true);
  });

  it('grants prices to OWNER implicitly and to others only explicitly', () => {
    expect(hasPermission({ role: 'OWNER', permissions: {} }, 'canSeePrices')).toBe(true);
    expect(hasPermission({ role: 'TECHNOLOGIST', permissions: {} }, 'canSeePrices')).toBe(false);
    expect(
      hasPermission({ role: 'TECHNOLOGIST', permissions: { canSeePrices: true } }, 'canSeePrices'),
    ).toBe(true);
  });

  it('defines a home route for every role', () => {
    for (const role of RoleSchema.options) expect(ROLE_HOME[role]).toMatch(/^\//);
  });
});
