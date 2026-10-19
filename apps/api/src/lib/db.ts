import { Prisma, PrismaClient } from '@prisma/client';

/**
 * Multi-tenancy (spec §13), two layers:
 *  1. `tenantDb(tenantId)` adds `tenantId` to every where/create of tenant models;
 *  2. every query runs in a transaction that sets `app.tenant_id`, so PostgreSQL RLS
 *     policies reject other tenants' rows even if a query forgets layer 1.
 * `systemDb` sets `app.bypass_rls` instead — only for flows that run before a tenant is known
 * (login, registration, refresh tokens, seeds).
 * The bare client sets neither, so it sees no tenant rows at all.
 */

/** Models with a `tenantId` column (`Tenant` itself is scoped by `id`). */
const TENANT_MODELS = new Set<string>([
  'User',
  'Brigade',
  'Customer',
  'OperationRef',
  'Model',
  'TechCard',
  'Order',
  'CuttingTask',
  'Bundle',
  'WorkRecord',
  'PayrollPeriod',
  'PayrollAdjustment',
  'AuditLog',
  'Counter',
  'Material',
  'Supplier',
  'StockMovement',
  'Defect',
]);

const WHERE_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'updateManyAndReturn',
  'delete',
  'deleteMany',
  'upsert',
]);

let base: PrismaClient | null = null;

export function prismaBase(): PrismaClient {
  base ??= new PrismaClient();
  return base;
}

export async function disconnectDb(): Promise<void> {
  await base?.$disconnect();
  base = null;
}

type Settings = Record<string, string>;

/** Runs every model query inside a transaction that first applies `set_config(..., true)`. */
function withSessionSettings(client: PrismaClient, settings: Settings) {
  const entries = Object.entries(settings);
  return client.$extends({
    name: 'session-settings',
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const [, ...rest] = await client.$transaction([
            client.$executeRaw`SELECT ${Prisma.join(
              entries.map(([key, value]) => Prisma.sql`set_config(${key}, ${value}, true)`),
            )}`,
            query(args),
          ]);
          return rest[0];
        },
      },
    },
  });
}

type AnyArgs = Record<string, unknown> & { where?: object; data?: unknown; create?: object };

function scopeArgs(model: string, operation: string, args: AnyArgs, tenantId: string): AnyArgs {
  const key = model === 'Tenant' ? 'id' : 'tenantId';
  const next: AnyArgs = { ...args };
  if (WHERE_OPERATIONS.has(operation)) next.where = { ...(args.where ?? {}), [key]: tenantId };
  if (model === 'Tenant') return next;
  if (operation === 'create') next.data = { ...(args.data as object), tenantId };
  if (operation === 'upsert') next.create = { ...(args.create ?? {}), tenantId };
  if (operation === 'createMany' || operation === 'createManyAndReturn') {
    const data = args.data;
    next.data = Array.isArray(data)
      ? data.map((row: object) => ({ ...row, tenantId }))
      : { ...(data as object), tenantId };
  }
  return next;
}

export function tenantDb(tenantId: string) {
  const client = prismaBase();
  return withSessionSettings(client, { 'app.tenant_id': tenantId }).$extends({
    name: 'tenant-scope',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (model !== 'Tenant' && !TENANT_MODELS.has(model)) return query(args);
          return query(scopeArgs(model, operation, args as AnyArgs, tenantId));
        },
      },
    },
  });
}

export type TenantDb = ReturnType<typeof tenantDb>;

let system: ReturnType<typeof withSessionSettings> | null = null;

/** Cross-tenant access for auth/system flows. Never hand this to request handlers by default. */
export function systemDb() {
  system ??= withSessionSettings(prismaBase(), { 'app.bypass_rls': 'on' });
  return system;
}

export type SystemDb = ReturnType<typeof systemDb>;

/**
 * Interactive transaction with RLS settings applied. Use for multi-step writes
 * (numbering, approvals). The `tx` client is not auto-scoped: pass `tenantId` explicitly —
 * RLS still blocks other tenants.
 */
export async function tenantTransaction<T>(
  tenantId: string,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prismaBase().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    return fn(tx);
  });
}

export async function systemTransaction<T>(
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  return prismaBase().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`;
    return fn(tx);
  });
}
