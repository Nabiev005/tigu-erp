import { describe, expect, it } from 'vitest';
import { OrderStatus, OrderStatusSchema, Role, RoleSchema } from './enums';

describe('enums', () => {
  it('exposes all roles from the spec', () => {
    expect(RoleSchema.options).toHaveLength(8);
    expect(Role.SEWER).toBe('SEWER');
  });

  it('rejects unknown order status', () => {
    expect(OrderStatusSchema.safeParse('DONE').success).toBe(false);
    expect(OrderStatusSchema.parse(OrderStatus.SEWING)).toBe('SEWING');
  });
});
