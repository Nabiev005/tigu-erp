import { Prisma } from '@prisma/client';
import type { AuthContext } from '../../plugins/auth';
import type { TenantDb } from '../../lib/db';

export interface AuditInput {
  action: string;
  entity: string;
  entityId: string;
  before?: unknown;
  after?: unknown;
}

const toJson = (value: unknown) =>
  value === undefined || value === null
    ? Prisma.JsonNull
    : (JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue);

/** Records who changed what, with before/after snapshots (spec §5). Never pass secrets here. */
export async function recordAudit(db: TenantDb, auth: AuthContext, input: AuditInput) {
  await db.auditLog.create({
    data: {
      tenantId: auth.tenantId,
      userId: auth.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      before: toJson(input.before),
      after: toJson(input.after),
    },
  });
}

/** Keeps only the fields whose values differ — compact before/after for updates. */
export function diff<T extends Record<string, unknown>>(before: T, after: T) {
  const b: Partial<T> = {};
  const a: Partial<T> = {};
  for (const key of Object.keys(after) as (keyof T)[]) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      b[key] = before[key];
      a[key] = after[key];
    }
  }
  return { before: b, after: a, changed: Object.keys(a).length > 0 };
}
