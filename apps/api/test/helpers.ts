import type { Role } from '@prisma/client';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { buildApp } from '../src/app';
import { parseEnv } from '../src/config/env';
import { disconnectDb, systemDb } from '../src/lib/db';
import { hashSecret } from '../src/lib/password';
import { MemoryMessageSender } from '../src/modules/notifications/sender';
import { TEST_DB } from './testDb';

export const PASSWORD = 'secret-pass-1';
export const PIN = '4321';

let hashes: Promise<{ password: string; pin: string }> | null = null;
const getHashes = () => {
  hashes ??= Promise.all([hashSecret(PASSWORD), hashSecret(PIN)]).then(([password, pin]) => ({
    password,
    pin,
  }));
  return hashes;
};

/** Empties every table (as the owner, so RLS does not get in the way). */
export async function resetDb(): Promise<void> {
  const client = new pg.Client({ connectionString: TEST_DB.adminUrl });
  await client.connect();
  const { rows } = await client.query<{ tablename: string }>(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`,
  );
  await client.query(`TRUNCATE ${rows.map((r) => `"${r.tablename}"`).join(', ')} CASCADE`);
  await client.end();
}

/** Builds the app once per file and wipes the DB before each test. */
export function useTestApp(overrides: Record<string, string> = {}) {
  const ctx = {} as { app: Awaited<ReturnType<typeof buildApp>>; sender: MemoryMessageSender };

  beforeAll(async () => {
    ctx.sender = new MemoryMessageSender();
    ctx.app = await buildApp({
      env: parseEnv({ ...process.env, ...overrides }),
      sender: ctx.sender,
      logger: false,
    });
    await ctx.app.ready();
  });

  beforeEach(async () => {
    await resetDb();
    ctx.sender.sent.length = 0;
  });

  afterAll(async () => {
    await ctx.app.close();
    await disconnectDb();
  });

  return ctx;
}

let phoneSeq = 0;
export const nextPhone = () => `+996700${String(100000 + phoneSeq++).slice(-6)}`;

export interface TestUserInput {
  role?: Role;
  fullName?: string;
  phone?: string;
  twoFactorEnabled?: boolean;
}

/** Creates a tenant with an owner (2FA off unless asked) directly in the DB. */
export async function createTenant(name = 'Цех', owner: TestUserInput = {}) {
  const { password } = await getHashes();
  const db = systemDb();
  const tenant = await db.tenant.create({ data: { name } });
  const user = await db.user.create({
    data: {
      tenantId: tenant.id,
      fullName: owner.fullName ?? `${name} ээси`,
      phone: owner.phone ?? nextPhone(),
      role: 'OWNER',
      passwordHash: password,
      twoFactorEnabled: owner.twoFactorEnabled ?? false,
    },
  });
  return { tenant, owner: user };
}

export async function createUser(tenantId: string, input: TestUserInput = {}) {
  const { password, pin } = await getHashes();
  const role = input.role ?? 'SEWER';
  return systemDb().user.create({
    data: {
      tenantId,
      fullName: input.fullName ?? `${role} колдонуучу`,
      phone: input.phone ?? nextPhone(),
      role,
      passwordHash: role === 'SEWER' ? null : password,
      pinHash: role === 'SEWER' ? pin : null,
      twoFactorEnabled: input.twoFactorEnabled ?? false,
    },
  });
}

/** Access token without going through login (login itself is covered in auth.test.ts). */
export function tokenFor(
  app: Awaited<ReturnType<typeof buildApp>>,
  user: { id: string; tenantId: string; role: Role },
) {
  return app.jwt.sign({ sub: user.id, tid: user.tenantId, role: user.role });
}

export const bearer = (token: string) => ({ authorization: `Bearer ${token}` });

/** Reads the refresh cookie from a response for the next request. */
export function refreshCookie(res: {
  cookies: { name: string; value: string }[];
}): Record<string, string> {
  const cookie = res.cookies.find((c) => c.name === 'tigu_rt');
  return cookie ? { tigu_rt: cookie.value } : {};
}
