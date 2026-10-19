import { describe, expect, it } from 'vitest';
import { systemDb } from '../src/lib/db';
import { buildApp } from '../src/app';
import { parseEnv } from '../src/config/env';
import { MemoryMessageSender } from '../src/modules/notifications/sender';
import {
  PASSWORD,
  PIN,
  createTenant,
  createUser,
  nextPhone,
  refreshCookie,
  useTestApp,
} from './helpers';

const ctx = useTestApp();

describe('registration (6.2)', () => {
  it('creates tenant + owner only after the phone is confirmed', async () => {
    const phone = nextPhone();
    const reg = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        companyName: 'Жаңы цех',
        employeesCount: 25,
        city: 'Ош',
        ownerFullName: 'Асан Үсөнов',
        phone,
        password: PASSWORD,
        channel: 'sms',
        acceptTerms: true,
      },
    });
    expect(reg.statusCode).toBe(201);
    expect(await systemDb().tenant.count()).toBe(0);

    const verify = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/otp/verify',
      payload: { challengeId: reg.json().challengeId, code: ctx.sender.lastCode(phone) },
    });
    expect(verify.statusCode).toBe(200);
    const session = verify.json();
    expect(session.user).toMatchObject({ role: 'OWNER', fullName: 'Асан Үсөнов' });
    expect(session.user.tenant.name).toBe('Жаңы цех');
    expect(refreshCookie(verify)).toHaveProperty('tigu_rt');

    const tenant = await systemDb().tenant.findFirstOrThrow();
    expect(tenant).toMatchObject({ city: 'Ош', employeesCount: 25 });
  });

  it('rejects a phone that is already registered', async () => {
    const { owner } = await createTenant();
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/register',
      payload: {
        companyName: 'Цех',
        employeesCount: 5,
        ownerFullName: 'Бакыт',
        phone: owner.phone,
        password: PASSWORD,
        channel: 'sms',
        acceptTerms: true,
      },
    });
    expect(res.statusCode).toBe(409);
    expect(res.json().error.code).toBe('PHONE_TAKEN');
  });
});

describe('password login + 2FA (1.1)', () => {
  it('asks for a 2FA code and opens a session with the right code', async () => {
    const { owner } = await createTenant('Цех', { twoFactorEnabled: true });
    const login = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { phone: owner.phone, password: PASSWORD },
    });
    expect(login.json()).toMatchObject({ status: '2FA_REQUIRED', channel: 'sms' });

    const wrong = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/2fa/verify',
      payload: { challengeId: login.json().challengeId, code: '000000' },
    });
    expect(wrong.json().error.code).toBe('INVALID_CODE');

    const ok = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/2fa/verify',
      payload: { challengeId: login.json().challengeId, code: ctx.sender.lastCode(owner.phone) },
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().user.id).toBe(owner.id);

    // A code works once.
    const again = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/2fa/verify',
      payload: { challengeId: login.json().challengeId, code: ctx.sender.lastCode(owner.phone) },
    });
    expect(again.statusCode).toBe(400);
  });

  it('allows 5 attempts per code, then refuses', async () => {
    const { owner } = await createTenant('Цех', { twoFactorEnabled: true });
    const login = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { phone: owner.phone, password: PASSWORD },
    });
    const { challengeId } = login.json();
    for (let i = 0; i < 5; i++) {
      await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/auth/2fa/verify',
        payload: { challengeId, code: '000000' },
      });
    }
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/2fa/verify',
      payload: { challengeId, code: ctx.sender.lastCode(owner.phone) },
    });
    expect(res.statusCode).toBe(429);
  });

  it('rejects a wrong password without revealing whether the phone exists', async () => {
    const { owner } = await createTenant();
    for (const phone of [owner.phone, nextPhone()]) {
      const res = await ctx.app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { phone, password: 'wrong-password' },
      });
      expect(res.statusCode).toBe(401);
      expect(res.json().error.code).toBe('INVALID_CREDENTIALS');
    }
  });
});

describe('PIN login (1.2)', () => {
  it('logs a sewer in with phone + PIN', async () => {
    const { tenant } = await createTenant();
    const sewer = await createUser(tenant.id, { role: 'SEWER' });
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/pin',
      payload: { phone: sewer.phone, pin: PIN },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().user.role).toBe('SEWER');
  });

  it('locks PIN login for 15 minutes after 5 wrong PINs', async () => {
    const { tenant } = await createTenant();
    const sewer = await createUser(tenant.id, { role: 'SEWER' });
    const attempt = (pin: string) =>
      ctx.app.inject({
        method: 'POST',
        url: '/api/v1/auth/pin',
        payload: { phone: sewer.phone, pin },
      });

    for (let i = 1; i <= 4; i++) {
      const res = await attempt('0000');
      expect(res.statusCode).toBe(401);
      expect(res.json().error.details.attemptsLeft).toBe(5 - i);
    }
    const locked = await attempt('0000');
    expect(locked.statusCode).toBe(423);
    const until = Date.parse(locked.json().error.details.lockedUntil);
    expect(until - Date.now()).toBeGreaterThan(14 * 60_000);

    // Even the right PIN is refused while locked.
    expect((await attempt(PIN)).statusCode).toBe(423);
  });
});

describe('refresh tokens', () => {
  it('rotates the token and treats reuse of an old one as theft', async () => {
    const { tenant } = await createTenant();
    const sewer = await createUser(tenant.id, { role: 'SEWER' });
    const login = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/pin',
      payload: { phone: sewer.phone, pin: PIN },
    });
    const first = refreshCookie(login);

    const rotated = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      cookies: first,
    });
    expect(rotated.statusCode).toBe(200);
    const second = refreshCookie(rotated);
    expect(second.tigu_rt).not.toBe(first.tigu_rt);

    // Two tabs refreshing together: the just-rotated token is accepted for a few seconds.
    const concurrent = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      cookies: first,
    });
    expect(concurrent.statusCode).toBe(200);

    // Later reuse of the old token means it leaked.
    await systemDb().refreshToken.updateMany({
      where: { rotatedAt: { not: null } },
      data: { rotatedAt: new Date(Date.now() - 60_000) },
    });
    const reuse = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      cookies: first,
    });
    expect(reuse.statusCode).toBe(401);
    // The whole family is revoked, including the newest token.
    const after = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      cookies: second,
    });
    expect(after.statusCode).toBe(401);
  });

  it('logout revokes the refresh token', async () => {
    const { tenant } = await createTenant();
    const sewer = await createUser(tenant.id, { role: 'SEWER' });
    const login = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/pin',
      payload: { phone: sewer.phone, pin: PIN },
    });
    const cookie = refreshCookie(login);
    const out = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      cookies: cookie,
    });
    expect(out.statusCode).toBe(204);
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      cookies: cookie,
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('OTP login', () => {
  it('logs in by code and answers the same for unknown phones', async () => {
    const { tenant } = await createTenant();
    const sewer = await createUser(tenant.id, { role: 'SEWER' });
    const send = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/otp/send',
      payload: { phone: sewer.phone, channel: 'telegram' },
    });
    expect(send.statusCode).toBe(200);
    const verify = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/otp/verify',
      payload: { challengeId: send.json().challengeId, code: ctx.sender.lastCode(sewer.phone) },
    });
    expect(verify.json().user.id).toBe(sewer.id);

    const unknown = nextPhone();
    const ghost = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/auth/otp/send',
      payload: { phone: unknown, channel: 'sms' },
    });
    expect(ghost.statusCode).toBe(200);
    expect(ctx.sender.last(unknown)).toBeUndefined();
  });
});

describe('rate limit (spec §13)', () => {
  it('allows 5 login attempts per 15 minutes per IP + phone', async () => {
    const app = await buildApp({
      env: parseEnv({ ...process.env, AUTH_RATE_LIMIT_MAX: '5' }),
      sender: new MemoryMessageSender(),
      logger: false,
    });
    const phone = nextPhone();
    const codes: number[] = [];
    for (let i = 0; i < 6; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { phone, password: 'x' },
      });
      codes.push(res.statusCode);
      if (i === 5) expect(res.json().error.code).toBe('TOO_MANY_ATTEMPTS');
    }
    expect(codes).toEqual([401, 401, 401, 401, 401, 429]);
    await app.close();
  });
});
