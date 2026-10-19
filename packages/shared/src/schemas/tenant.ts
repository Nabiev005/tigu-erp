import { z } from 'zod';

export const TIMEZONES = ['Asia/Bishkek', 'Asia/Almaty', 'Asia/Tashkent', 'Europe/Moscow'] as const;

export const TenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  city: z.string().nullable(),
  plan: z.string(),
  timezone: z.string(),
  /** ISO weekdays, 1 = Monday. */
  workDays: z.array(z.number().int().min(1).max(7)),
  shiftHours: z.number().int(),
  employeesCount: z.number().int().nullable(),
  createdAt: z.string().datetime(),
});
export type Tenant = z.infer<typeof TenantSchema>;

// PATCH /tenant
export const TenantUpdateRequestSchema = z.object({
  name: z.string().trim().min(2, 'validation.required').max(120).optional(),
  city: z.string().trim().max(80).nullable().optional(),
  timezone: z.enum(TIMEZONES).optional(),
  workDays: z
    .array(z.number().int().min(1).max(7))
    .min(1, 'validation.workDays')
    .max(7)
    .refine((days) => new Set(days).size === days.length, 'validation.workDays')
    .optional(),
  shiftHours: z
    .number({ invalid_type_error: 'validation.shiftHours' })
    .int('validation.shiftHours')
    .min(1, 'validation.shiftHours')
    .max(24, 'validation.shiftHours')
    .optional(),
});
export type TenantUpdateRequest = z.infer<typeof TenantUpdateRequestSchema>;

export const AuditLogEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string().nullable(),
  action: z.string(),
  entity: z.string(),
  entityId: z.string(),
  before: z.unknown().nullable(),
  after: z.unknown().nullable(),
  createdAt: z.string().datetime(),
});
export type AuditLogEntry = z.infer<typeof AuditLogEntrySchema>;

export const AuditLogQuerySchema = z.object({
  entity: z.string().optional(),
  entityId: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(50),
});
export type AuditLogQuery = z.input<typeof AuditLogQuerySchema>;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** `{ items, total, page, pageSize }` (spec §8). */
export function paginated<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number().int(),
    page: z.number().int(),
    pageSize: z.number().int(),
  });
}
