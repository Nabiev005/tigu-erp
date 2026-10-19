import { createHash, randomBytes } from 'node:crypto';
import type { Tenant, User } from '@prisma/client';
import type {
  AuthUser,
  CodeVerifyRequest,
  LoginRequest,
  LoginResponse,
  OtpChallenge,
  OtpChannel,
  OtpSendRequest,
  PinLoginRequest,
  RegisterRequest,
  Session,
} from '@tigu/shared';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { Env } from '../../config/env';
import { message } from '../../i18n';
import { systemDb, systemTransaction } from '../../lib/db';
import { OTP_MAX_ATTEMPTS, OTP_TTL_MS, generateOtp, hashOtp, otpMatches } from '../../lib/otp';
import { hashSecret, verifySecret } from '../../lib/password';
import { AppError, unauthorized } from '../../plugins/errors';
import {
  ACCESS_TOKEN_TTL,
  REFRESH_COOKIE,
  REFRESH_TTL_MS,
  parsePermissions,
} from '../../plugins/auth';
import type { MessageSender } from '../notifications/sender';

export const MAX_PIN_ATTEMPTS = 5; // spec §9, 1.2
export const PIN_LOCK_MS = 15 * 60_000;
/** How long a just-rotated refresh token is still accepted (concurrent tabs). */
export const ROTATION_GRACE_MS = 10_000;

type OtpPurpose = '2fa' | 'login' | 'register';
type UserWithTenant = User & { tenant: Tenant };

const RegisterPayloadSchema = z.object({
  companyName: z.string(),
  employeesCount: z.number().int(),
  city: z.string().optional(),
  ownerFullName: z.string(),
  passwordHash: z.string(),
});

export interface AuthDeps {
  app: FastifyInstance;
  env: Env;
  sender: MessageSender;
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

export function toAuthUser(user: UserWithTenant): AuthUser {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    permissions: parsePermissions(user.permissions),
    locale: user.locale,
    tenant: { id: user.tenant.id, name: user.tenant.name },
  };
}

function refreshCookieOptions(env: Env) {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/api/v1/auth',
    maxAge: Math.floor(REFRESH_TTL_MS / 1000),
  };
}

export function clearRefreshCookie(reply: FastifyReply) {
  reply.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
}

/** Issues a 15-min access token and a rotating 30-day refresh cookie (spec §3). */
async function issueSession(
  deps: AuthDeps,
  request: FastifyRequest,
  reply: FastifyReply,
  user: UserWithTenant,
): Promise<Session> {
  const accessToken = deps.app.jwt.sign(
    { sub: user.id, tid: user.tenantId, role: user.role },
    { expiresIn: ACCESS_TOKEN_TTL },
  );
  const refreshToken = randomBytes(32).toString('base64url');
  await systemDb().refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
      userAgent: request.headers['user-agent']?.slice(0, 255) ?? null,
    },
  });
  reply.setCookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions(deps.env));
  return { accessToken, user: toAuthUser(user) };
}

// ---------- one-time codes ----------

async function createChallenge(
  deps: AuthDeps,
  input: {
    phone: string;
    channel: OtpChannel;
    purpose: OtpPurpose;
    user?: UserWithTenant | null;
    payload?: z.infer<typeof RegisterPayloadSchema>;
    locale?: 'ky' | 'ru';
  },
): Promise<OtpChallenge> {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  const otp = await systemDb().otpCode.create({
    data: {
      phone: input.phone,
      codeHash: hashOtp(deps.env.OTP_SECRET, input.phone, code),
      channel: input.channel,
      purpose: input.purpose,
      userId: input.user?.id ?? null,
      payload: input.payload ?? undefined,
      expiresAt,
    },
  });
  // Unknown phone: no message, but the same response (does not reveal registered numbers).
  if (input.user !== null) {
    await deps.sender.send({
      phone: input.phone,
      channel: input.channel,
      telegramChatId: input.user?.telegramChatId,
      text: message(input.user?.locale ?? input.locale ?? 'ky', 'code', { code }),
    });
  }
  return { challengeId: otp.id, channel: input.channel, expiresAt: expiresAt.toISOString() };
}

async function consumeChallenge(deps: AuthDeps, body: CodeVerifyRequest, purposes: OtpPurpose[]) {
  const db = systemDb();
  const otp = await db.otpCode.findUnique({ where: { id: body.challengeId } });
  if (!otp || otp.usedAt || !purposes.includes(otp.purpose as OtpPurpose)) {
    throw new AppError(400, 'INVALID_CODE', 'Unknown or used challenge');
  }
  if (otp.expiresAt.getTime() < Date.now()) throw new AppError(400, 'CODE_EXPIRED', 'Code expired');
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    throw new AppError(429, 'TOO_MANY_ATTEMPTS', 'Too many attempts');
  }
  if (!otpMatches(deps.env.OTP_SECRET, otp.phone, body.code, otp.codeHash)) {
    await db.otpCode.update({ where: { id: otp.id }, data: { attempts: { increment: 1 } } });
    throw new AppError(400, 'INVALID_CODE', 'Invalid code');
  }
  // Mark used atomically: a second request with the same code loses the race.
  const used = await db.otpCode.updateMany({
    where: { id: otp.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (used.count === 0) throw new AppError(400, 'INVALID_CODE', 'Code already used');
  return otp;
}

async function activeUser(id: string): Promise<UserWithTenant> {
  const user = await systemDb().user.findFirst({
    where: { id, isActive: true },
    include: { tenant: true },
  });
  if (!user) throw new AppError(400, 'INVALID_CODE', 'Invalid code');
  return user;
}

async function phoneTaken(phone: string): Promise<boolean> {
  return (await systemDb().user.count({ where: { phone } })) > 0;
}

// ---------- flows ----------

export function authService(deps: AuthDeps) {
  return {
    /** POST /auth/register — nothing is created until the phone is confirmed. */
    async register(body: RegisterRequest): Promise<OtpChallenge> {
      if (await phoneTaken(body.phone)) {
        throw new AppError(409, 'PHONE_TAKEN', 'Phone already registered');
      }
      return createChallenge(deps, {
        phone: body.phone,
        channel: body.channel,
        purpose: 'register',
        payload: {
          companyName: body.companyName,
          employeesCount: body.employeesCount,
          city: body.city || undefined,
          ownerFullName: body.ownerFullName,
          passwordHash: await hashSecret(body.password),
        },
      });
    },

    async login(
      req: FastifyRequest,
      reply: FastifyReply,
      body: LoginRequest,
    ): Promise<LoginResponse> {
      const candidates = await systemDb().user.findMany({
        where: { phone: body.phone, isActive: true, passwordHash: { not: null } },
        include: { tenant: true },
      });
      let user: UserWithTenant | undefined;
      for (const candidate of candidates) {
        if (await verifySecret(candidate.passwordHash, body.password)) {
          user = candidate;
          break;
        }
      }
      if (candidates.length === 0) await verifySecret(null, body.password);
      if (!user) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid phone or password');

      if (!user.twoFactorEnabled) {
        return { status: 'OK', ...(await issueSession(deps, req, reply, user)) };
      }
      const challenge = await createChallenge(deps, {
        phone: user.phone,
        channel: user.telegramChatId ? 'telegram' : 'sms',
        purpose: '2fa',
        user,
      });
      return { status: '2FA_REQUIRED', ...challenge };
    },

    async verify2fa(req: FastifyRequest, reply: FastifyReply, body: CodeVerifyRequest) {
      const otp = await consumeChallenge(deps, body, ['2fa']);
      return issueSession(deps, req, reply, await activeUser(otp.userId ?? ''));
    },

    /** POST /auth/pin — 5 wrong PINs lock PIN login for 15 minutes (spec §9, 1.2). */
    async pin(req: FastifyRequest, reply: FastifyReply, body: PinLoginRequest): Promise<Session> {
      const db = systemDb();
      const user = await db.user.findFirst({
        where: { phone: body.phone, isActive: true, pinHash: { not: null } },
        include: { tenant: true },
      });
      if (!user) {
        await verifySecret(null, body.pin);
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid phone or PIN', {
          attemptsLeft: MAX_PIN_ATTEMPTS - 1,
        });
      }
      if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
        throw new AppError(423, 'PIN_LOCKED', 'PIN login locked', {
          lockedUntil: user.lockedUntil.toISOString(),
        });
      }
      if (!(await verifySecret(user.pinHash, body.pin))) {
        const failed = user.failedPinCount + 1;
        if (failed >= MAX_PIN_ATTEMPTS) {
          const lockedUntil = new Date(Date.now() + PIN_LOCK_MS);
          await db.user.update({
            where: { id: user.id },
            data: { failedPinCount: 0, lockedUntil },
          });
          throw new AppError(423, 'PIN_LOCKED', 'PIN login locked', {
            lockedUntil: lockedUntil.toISOString(),
          });
        }
        await db.user.update({ where: { id: user.id }, data: { failedPinCount: failed } });
        throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid phone or PIN', {
          attemptsLeft: MAX_PIN_ATTEMPTS - failed,
        });
      }
      if (user.failedPinCount > 0 || user.lockedUntil) {
        await db.user.update({
          where: { id: user.id },
          data: { failedPinCount: 0, lockedUntil: null },
        });
      }
      return issueSession(deps, req, reply, user);
    },

    async sendOtp(body: OtpSendRequest): Promise<OtpChallenge> {
      const user = await systemDb().user.findFirst({
        where: { phone: body.phone, isActive: true },
        include: { tenant: true },
      });
      return createChallenge(deps, { ...body, purpose: 'login', user: user ?? null });
    },

    /** OTP login, or the phone confirmation that completes registration. */
    async verifyOtp(req: FastifyRequest, reply: FastifyReply, body: CodeVerifyRequest) {
      const otp = await consumeChallenge(deps, body, ['login', 'register']);
      if (otp.purpose === 'login') {
        return issueSession(deps, req, reply, await activeUser(otp.userId ?? ''));
      }
      const payload = RegisterPayloadSchema.parse(otp.payload);
      const owner = await systemTransaction(async (tx) => {
        if ((await tx.user.count({ where: { phone: otp.phone } })) > 0) {
          throw new AppError(409, 'PHONE_TAKEN', 'Phone already registered');
        }
        const tenant = await tx.tenant.create({
          data: {
            name: payload.companyName,
            city: payload.city ?? null,
            employeesCount: payload.employeesCount,
          },
        });
        return tx.user.create({
          data: {
            tenantId: tenant.id,
            fullName: payload.ownerFullName,
            phone: otp.phone,
            passwordHash: payload.passwordHash,
            role: 'OWNER',
            twoFactorEnabled: true,
          },
          include: { tenant: true },
        });
      });
      return issueSession(deps, req, reply, owner);
    },

    /** Rotates the refresh token. Reusing a revoked token revokes the whole family. */
    async refresh(req: FastifyRequest, reply: FastifyReply): Promise<Session> {
      const token = req.cookies[REFRESH_COOKIE];
      if (!token) throw unauthorized('No refresh token');
      const db = systemDb();
      const stored = await db.refreshToken.findUnique({
        where: { tokenHash: sha256(token) },
        include: { user: { include: { tenant: true } } },
      });
      if (!stored) {
        clearRefreshCookie(reply);
        throw unauthorized('Unknown refresh token');
      }
      if (stored.expiresAt.getTime() < Date.now() || !stored.user.isActive) {
        clearRefreshCookie(reply);
        throw unauthorized('Refresh token expired');
      }
      if (stored.revokedAt) {
        // Two tabs refreshing at once send the same cookie: tolerate it for a few seconds.
        const justRotated =
          stored.rotatedAt && Date.now() - stored.rotatedAt.getTime() < ROTATION_GRACE_MS;
        if (justRotated) return issueSession(deps, req, reply, stored.user);
        await revokeAllSessions(stored.userId);
        clearRefreshCookie(reply);
        throw unauthorized('Refresh token reuse detected');
      }
      const now = new Date();
      const rotated = await db.refreshToken.updateMany({
        where: { id: stored.id, revokedAt: null },
        data: { revokedAt: now, rotatedAt: now },
      });
      if (rotated.count === 0) throw unauthorized('Refresh token already used');
      return issueSession(deps, req, reply, stored.user);
    },

    async logout(req: FastifyRequest, reply: FastifyReply): Promise<void> {
      const token = req.cookies[REFRESH_COOKIE];
      if (token) {
        await systemDb().refreshToken.updateMany({
          where: { tokenHash: sha256(token), revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      clearRefreshCookie(reply);
    },
  };
}

export type AuthService = ReturnType<typeof authService>;

/**
 * Revokes every session of a user (deactivation, detected theft). Clearing `rotatedAt` also
 * closes the rotation grace window, so a stolen recently-rotated token cannot be replayed.
 */
export async function revokeAllSessions(userId: string): Promise<void> {
  const db = systemDb();
  await db.refreshToken.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await db.refreshToken.updateMany({ where: { userId }, data: { rotatedAt: null } });
}
