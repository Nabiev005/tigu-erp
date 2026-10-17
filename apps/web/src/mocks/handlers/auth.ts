import {
  CodeVerifyRequestSchema,
  LoginRequestSchema,
  OtpSendRequestSchema,
  PinLoginRequestSchema,
  RegisterRequestSchema,
  type OtpChallenge,
  type Session,
} from '@tigu/shared';
import { HttpResponse, http } from 'msw';
import { db, newId, type MockChallenge, type MockUser } from '../data/db';
import { API, apiError, parseBody } from './utils';

const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCK_MS = 15 * 60_000;
const MAX_CODE_ATTEMPTS = 5;

function session(user: MockUser): Session {
  db.setSession(user.id);
  return { accessToken: `mock-access-${user.id}`, user: db.toAuthUser(user) };
}

function challengeDto(c: MockChallenge, channel: OtpChallenge['channel']): OtpChallenge {
  return { challengeId: c.id, channel, expiresAt: new Date(c.expiresAt).toISOString() };
}

/** Shared code check for 2FA, OTP login and phone confirmation (5 min, 5 attempts). */
function verifyCode(challengeId: string, code: string, purpose: MockChallenge['purpose']) {
  const c = db.getChallenge(challengeId);
  if (!c || c.purpose !== purpose)
    return { error: apiError(400, 'INVALID_CODE', 'Unknown challenge') };
  if (Date.now() > c.expiresAt) {
    db.deleteChallenge(c.id);
    return { error: apiError(400, 'CODE_EXPIRED', 'Code expired') };
  }
  if (c.attempts >= MAX_CODE_ATTEMPTS) {
    return { error: apiError(429, 'TOO_MANY_ATTEMPTS', 'Too many attempts') };
  }
  if (c.code !== code) {
    c.attempts += 1;
    return { error: apiError(400, 'INVALID_CODE', 'Invalid code') };
  }
  db.deleteChallenge(c.id);
  const user = c.userId ? db.findUser(c.userId) : undefined;
  if (!user) return { error: apiError(400, 'INVALID_CODE', 'Invalid code') };
  return { user };
}

export const authHandlers = [
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = await parseBody(request, LoginRequestSchema);
    if (!body.ok) return body.response;
    const user = db.findUserByPhone(body.data.phone);
    if (!user?.password || user.password !== body.data.password) {
      return apiError(401, 'INVALID_CREDENTIALS', 'Invalid phone or password');
    }
    if (!user.twoFactor) return HttpResponse.json({ status: 'OK', ...session(user) });
    const c = db.createChallenge({ phone: user.phone, userId: user.id, purpose: '2fa' });
    return HttpResponse.json({ status: '2FA_REQUIRED', ...challengeDto(c, 'telegram') });
  }),

  http.post(`${API}/auth/2fa/verify`, async ({ request }) => {
    const body = await parseBody(request, CodeVerifyRequestSchema);
    if (!body.ok) return body.response;
    const result = verifyCode(body.data.challengeId, body.data.code, '2fa');
    return result.error ?? HttpResponse.json(session(result.user));
  }),

  http.post(`${API}/auth/pin`, async ({ request }) => {
    const body = await parseBody(request, PinLoginRequestSchema);
    if (!body.ok) return body.response;
    const user = db.findUserByPhone(body.data.phone);
    // Unknown phone looks exactly like a wrong PIN.
    if (!user?.pin) {
      return apiError(401, 'INVALID_CREDENTIALS', 'Invalid phone or PIN', {
        attemptsLeft: MAX_PIN_ATTEMPTS - 1,
      });
    }
    if (user.lockedUntil && user.lockedUntil > Date.now()) {
      return apiError(423, 'PIN_LOCKED', 'PIN login locked', {
        lockedUntil: new Date(user.lockedUntil).toISOString(),
      });
    }
    if (user.pin !== body.data.pin) {
      const failed = user.failedPinCount + 1;
      if (failed >= MAX_PIN_ATTEMPTS) {
        const lockedUntil = Date.now() + PIN_LOCK_MS;
        db.updateUser(user.id, { failedPinCount: 0, lockedUntil });
        return apiError(423, 'PIN_LOCKED', 'PIN login locked', {
          lockedUntil: new Date(lockedUntil).toISOString(),
        });
      }
      db.updateUser(user.id, { failedPinCount: failed });
      return apiError(401, 'INVALID_CREDENTIALS', 'Invalid phone or PIN', {
        attemptsLeft: MAX_PIN_ATTEMPTS - failed,
      });
    }
    db.updateUser(user.id, { failedPinCount: 0, lockedUntil: null });
    return HttpResponse.json(session(user));
  }),

  http.post(`${API}/auth/otp/send`, async ({ request }) => {
    const body = await parseBody(request, OtpSendRequestSchema);
    if (!body.ok) return body.response;
    // Always 200 so the endpoint does not reveal which phones are registered.
    const user = db.findUserByPhone(body.data.phone);
    const c = db.createChallenge({
      phone: body.data.phone,
      userId: user?.id ?? null,
      purpose: 'otp',
    });
    return HttpResponse.json(challengeDto(c, body.data.channel));
  }),

  http.post(`${API}/auth/otp/verify`, async ({ request }) => {
    const body = await parseBody(request, CodeVerifyRequestSchema);
    if (!body.ok) return body.response;
    const result = verifyCode(body.data.challengeId, body.data.code, 'otp');
    return result.error ?? HttpResponse.json(session(result.user));
  }),

  http.post(`${API}/auth/register`, async ({ request }) => {
    const body = await parseBody(request, RegisterRequestSchema);
    if (!body.ok) return body.response;
    const { companyName, ownerFullName, phone, password, channel } = body.data;
    if (db.findUserByPhone(phone)) return apiError(409, 'PHONE_TAKEN', 'Phone already registered');
    const tenantId = newId('t');
    db.addTenant({ id: tenantId, name: companyName });
    const owner: MockUser = {
      id: newId('u'),
      tenantId,
      fullName: ownerFullName,
      phone,
      role: 'OWNER',
      permissions: {},
      locale: 'ky',
      password,
      twoFactor: true,
      failedPinCount: 0,
      lockedUntil: null,
    };
    db.addUser(owner);
    const c = db.createChallenge({ phone, userId: owner.id, purpose: 'otp' });
    return HttpResponse.json(challengeDto(c, channel), { status: 201 });
  }),

  http.post(`${API}/auth/refresh`, () => {
    const userId = db.getSession();
    const user = userId ? db.findUser(userId) : undefined;
    if (!user) return apiError(401, 'UNAUTHORIZED', 'No session');
    return HttpResponse.json(session(user));
  }),

  http.post(`${API}/auth/logout`, () => {
    db.setSession(null);
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(`${API}/auth/me`, ({ request }) => {
    const token = request.headers.get('Authorization')?.replace('Bearer mock-access-', '');
    const user = token ? db.findUser(token) : undefined;
    if (!user) return apiError(401, 'UNAUTHORIZED', 'Not signed in');
    return HttpResponse.json(db.toAuthUser(user));
  }),
];
