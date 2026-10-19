import cookie from '@fastify/cookie';
import jwt from '@fastify/jwt';
import {
  PermissionsSchema,
  canAccessSection,
  hasPermission,
  type Permission,
  type Permissions,
  type Role,
  type Section,
} from '@tigu/shared';
import type { FastifyInstance, FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import fp from 'fastify-plugin';
import type { Env } from '../config/env';
import { tenantDb, type TenantDb } from '../lib/db';
import { forbidden, unauthorized } from './errors';

export interface AccessTokenPayload {
  sub: string;
  tid: string;
  role: Role;
}

export interface AuthContext {
  userId: string;
  tenantId: string;
  role: Role;
  permissions: Permissions;
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AccessTokenPayload;
    user: AccessTokenPayload;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthContext;
    /** Tenant-scoped Prisma client (auto `where tenantId` + RLS). */
    db: TenantDb;
  }
  interface FastifyInstance {
    authenticate: preHandlerHookHandler;
  }
}

export const ACCESS_TOKEN_TTL = '15m';
export const REFRESH_COOKIE = 'tigu_rt';
export const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export function parsePermissions(value: unknown): Permissions {
  const parsed = PermissionsSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}

/**
 * JWT access tokens (15 min, Authorization header) + httpOnly refresh cookie (30 days).
 * `tenantId` always comes from the verified token — never from the URL or body (spec §8, §19).
 */
export const authPlugin = fp(async (app: FastifyInstance, opts: { env: Env }) => {
  await app.register(cookie);
  await app.register(jwt, { secret: opts.env.JWT_SECRET, sign: { expiresIn: ACCESS_TOKEN_TTL } });

  app.decorateRequest('auth', null);
  app.decorateRequest('db', null);

  app.decorate('authenticate', async (request: FastifyRequest, _reply: FastifyReply) => {
    let payload: AccessTokenPayload;
    try {
      payload = await request.jwtVerify<AccessTokenPayload>();
    } catch {
      throw unauthorized('Invalid or expired access token');
    }
    const db = tenantDb(payload.tid);
    // Re-read the user: deactivation and role changes apply immediately.
    const user = await db.user.findFirst({
      where: { id: payload.sub, isActive: true },
      select: { id: true, role: true, permissions: true },
    });
    if (!user) throw unauthorized('User is not active');
    request.auth = {
      userId: user.id,
      tenantId: payload.tid,
      role: user.role,
      permissions: parsePermissions(user.permissions),
    };
    request.db = db;
  });
});

/** Allows only the given roles (spec §5: checked on the backend, the UI merely hides). */
export function requireRole(...roles: Role[]): preHandlerHookHandler {
  return async (request) => {
    if (!roles.includes(request.auth.role))
      throw forbidden(`Role ${request.auth.role} not allowed`);
  };
}

/** Same matrix the web app uses for menus (packages/shared/src/permissions.ts). */
export function requireSection(section: Section): preHandlerHookHandler {
  return async (request) => {
    if (!canAccessSection(request.auth.role, section)) {
      throw forbidden(`Role ${request.auth.role} cannot access ${section}`);
    }
  };
}

export function requirePermission(permission: Permission): preHandlerHookHandler {
  return async (request) => {
    if (!hasPermission(request.auth, permission)) throw forbidden(`Missing ${permission}`);
  };
}
