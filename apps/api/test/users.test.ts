import type { Role } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { PIN, bearer, createTenant, createUser, nextPhone, tokenFor, useTestApp } from './helpers';

const ctx = useTestApp();

describe('roles (spec §5)', () => {
  it.each<Role>(['SEWER', 'ACCOUNTANT', 'TECHNOLOGIST', 'FOREMAN', 'CLIENT'])(
    '%s cannot read users and salaries (403)',
    async (role) => {
      const { tenant } = await createTenant();
      const user = await createUser(tenant.id, { role });
      const res = await ctx.app.inject({
        method: 'GET',
        url: '/api/v1/users',
        headers: bearer(tokenFor(ctx.app, user)),
      });
      expect(res.statusCode).toBe(403);
    },
  );

  it('rejects requests without a valid token', async () => {
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: bearer('garbage'),
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('users (2.10)', () => {
  it('creates a sewer, sends the PIN, and the sewer can log in with it', async () => {
    const { owner } = await createTenant();
    const phone = nextPhone();
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: bearer(tokenFor(ctx.app, owner)),
      payload: { fullName: 'Мээрим Абдыкадырова', phone, role: 'SEWER' },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({ role: 'SEWER', payType: 'PIECE', twoFactorEnabled: false });
    expect(res.json()).not.toHaveProperty('pinHash');

    const pin = ctx.sender.lastCode(phone);
    expect(pin).toMatch(/^\d{4}$/);
    const login = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/pin',
      payload: { phone, pin },
    });
    expect(login.statusCode).toBe(200);
  });

  it('requires a salary for SALARY pay type and refuses a taken phone', async () => {
    const { tenant, owner } = await createTenant();
    const token = tokenFor(ctx.app, owner);
    const noSalary = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: bearer(token),
      payload: { fullName: 'Бухгалтер', phone: nextPhone(), role: 'ACCOUNTANT', payType: 'SALARY' },
    });
    expect(noSalary.statusCode).toBe(400);

    const existing = await createUser(tenant.id);
    const taken = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/users',
      headers: bearer(token),
      payload: { fullName: 'Дубль', phone: existing.phone, role: 'SEWER' },
    });
    expect(taken.json().error.code).toBe('PHONE_TAKEN');
  });

  it('writes role changes to the audit log with before/after', async () => {
    const { tenant, owner } = await createTenant();
    const token = tokenFor(ctx.app, owner);
    const user = await createUser(tenant.id, { role: 'CUTTER' });
    const patch = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/v1/users/${user.id}`,
      headers: bearer(token),
      payload: { role: 'FOREMAN', permissions: { canSeePrices: true } },
    });
    expect(patch.statusCode).toBe(200);

    const log = await ctx.app.inject({
      method: 'GET',
      url: `/api/v1/audit-log?entity=User&entityId=${user.id}`,
      headers: bearer(token),
    });
    const [entry] = log.json().items;
    expect(entry).toMatchObject({
      action: 'user.update',
      userId: owner.id,
      userName: owner.fullName,
      before: { role: 'CUTTER', permissions: {} },
      after: { role: 'FOREMAN', permissions: { canSeePrices: true } },
    });
  });

  it('does not let the owner demote or deactivate themselves', async () => {
    const { owner } = await createTenant();
    const res = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/v1/users/${owner.id}`,
      headers: bearer(tokenFor(ctx.app, owner)),
      payload: { isActive: false },
    });
    expect(res.statusCode).toBe(403);
    expect(res.json().error.code).toBe('CANNOT_MODIFY_SELF');
  });

  it('cuts off a deactivated user immediately', async () => {
    const { tenant, owner } = await createTenant();
    const user = await createUser(tenant.id, { role: 'SEWER' });
    const userToken = tokenFor(ctx.app, user);
    const login = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/pin',
      payload: { phone: user.phone, pin: PIN },
    });
    await ctx.app.inject({
      method: 'PATCH',
      url: `/api/v1/users/${user.id}`,
      headers: bearer(tokenFor(ctx.app, owner)),
      payload: { isActive: false },
    });
    const me = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: bearer(userToken),
    });
    expect(me.statusCode).toBe(401);
    const cookie = login.cookies.find((c) => c.name === 'tigu_rt');
    const refresh = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      cookies: { tigu_rt: cookie?.value ?? '' },
    });
    expect(refresh.statusCode).toBe(401);
  });

  it('resets a sewer PIN and unlocks them; refuses for non-sewers', async () => {
    const { tenant, owner } = await createTenant();
    const token = tokenFor(ctx.app, owner);
    const sewer = await createUser(tenant.id, { role: 'SEWER' });
    for (let i = 0; i < 5; i++) {
      await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/auth/pin',
        payload: { phone: sewer.phone, pin: '0000' },
      });
    }
    const reset = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/users/${sewer.id}/reset-pin`,
      headers: bearer(token),
    });
    expect(reset.json().pinLocked).toBe(false);
    const login = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/pin',
      payload: { phone: sewer.phone, pin: ctx.sender.lastCode(sewer.phone) },
    });
    expect(login.statusCode).toBe(200);

    const notSewer = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/users/${owner.id}/reset-pin`,
      headers: bearer(token),
    });
    expect(notSewer.json().error.code).toBe('NOT_A_SEWER');
  });
});

describe('company settings', () => {
  it('updates work days and shift length and audits the change', async () => {
    const { owner } = await createTenant();
    const token = tokenFor(ctx.app, owner);
    const res = await ctx.app.inject({
      method: 'PATCH',
      url: '/api/v1/tenant',
      headers: bearer(token),
      payload: { workDays: [1, 2, 3, 4, 5], shiftHours: 9 },
    });
    expect(res.json()).toMatchObject({ workDays: [1, 2, 3, 4, 5], shiftHours: 9 });
    const log = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/audit-log?entity=Tenant',
      headers: bearer(token),
    });
    expect(log.json().items[0]).toMatchObject({
      action: 'tenant.update',
      before: { workDays: [1, 2, 3, 4, 5, 6], shiftHours: 8 },
      after: { workDays: [1, 2, 3, 4, 5], shiftHours: 9 },
    });
  });
});
