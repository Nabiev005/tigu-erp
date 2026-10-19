import type { Tenant as DbTenant } from '@prisma/client';
import {
  AuditLogEntrySchema,
  AuditLogQuerySchema,
  TenantSchema,
  TenantUpdateRequestSchema,
  paginated,
  type Tenant,
} from '@tigu/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { requireSection } from '../../plugins/auth';
import { notFound } from '../../plugins/errors';
import { diff, recordAudit } from '../audit/service';

const security = [{ bearer: [] }];

function toTenantDto(t: DbTenant): Tenant {
  return {
    id: t.id,
    name: t.name,
    city: t.city,
    plan: t.plan,
    timezone: t.timezone,
    workDays: t.workDays,
    shiftHours: t.shiftHours,
    employeesCount: t.employeesCount,
    createdAt: t.createdAt.toISOString(),
  };
}

/** Company settings and the audit log (spec §9, 2.10; OWNER only). */
export const settingsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', app.authenticate);
  app.addHook('preHandler', requireSection('settings'));

  app.get(
    '/tenant',
    { schema: { tags: ['settings'], security, response: { 200: TenantSchema } } },
    async (req) => {
      const tenant = await req.db.tenant.findFirst();
      if (!tenant) throw notFound('Tenant');
      return toTenantDto(tenant);
    },
  );

  app.patch(
    '/tenant',
    {
      schema: {
        tags: ['settings'],
        security,
        body: TenantUpdateRequestSchema,
        response: { 200: TenantSchema },
      },
    },
    async (req) => {
      const current = await req.db.tenant.findFirst();
      if (!current) throw notFound('Tenant');
      const updated = await req.db.tenant.update({ where: { id: current.id }, data: req.body });
      const view = (t: DbTenant) => ({
        name: t.name,
        city: t.city,
        timezone: t.timezone,
        workDays: t.workDays,
        shiftHours: t.shiftHours,
      });
      const changes = diff(view(current), view(updated));
      if (changes.changed) {
        await recordAudit(req.db, req.auth, {
          action: 'tenant.update',
          entity: 'Tenant',
          entityId: current.id,
          before: changes.before,
          after: changes.after,
        });
      }
      return toTenantDto(updated);
    },
  );

  app.get(
    '/audit-log',
    {
      schema: {
        tags: ['settings'],
        security,
        querystring: AuditLogQuerySchema,
        response: { 200: paginated(AuditLogEntrySchema) },
      },
    },
    async (req) => {
      const { entity, entityId, page, pageSize } = req.query;
      const where = { ...(entity ? { entity } : {}), ...(entityId ? { entityId } : {}) };
      const [total, rows] = await Promise.all([
        req.db.auditLog.count({ where }),
        req.db.auditLog.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
      ]);
      const users = await req.db.user.findMany({
        where: { id: { in: [...new Set(rows.map((r) => r.userId))] } },
        select: { id: true, fullName: true },
      });
      const names = new Map(users.map((u) => [u.id, u.fullName]));
      return {
        items: rows.map((r) => ({
          id: r.id,
          userId: r.userId,
          userName: names.get(r.userId) ?? null,
          action: r.action,
          entity: r.entity,
          entityId: r.entityId,
          before: r.before,
          after: r.after,
          createdAt: r.createdAt.toISOString(),
        })),
        total,
        page,
        pageSize,
      };
    },
  );
};
