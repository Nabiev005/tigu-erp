import { z } from 'zod';
import { LocaleSchema, PayTypeSchema, RoleSchema } from '../enums';
import { PermissionsSchema } from '../permissions';
import { PhoneSchema } from './auth';

/** Roles that sign in with a password (everyone except sewers, who use a PIN). */
export const PASSWORD_ROLES = RoleSchema.exclude(['SEWER']).options;

export const UserSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  phone: PhoneSchema,
  role: RoleSchema,
  permissions: PermissionsSchema,
  brigadeId: z.string().nullable(),
  payType: PayTypeSchema,
  /** Tiyin; only for SALARY. */
  monthlySalary: z.number().int().nullable(),
  locale: LocaleSchema,
  twoFactorEnabled: z.boolean(),
  isActive: z.boolean(),
  telegramLinked: z.boolean(),
  pinLocked: z.boolean(),
  createdAt: z.string().datetime(),
});
export type User = z.infer<typeof UserSchema>;

const salaryRule = <T extends { payType?: string; monthlySalary?: number | null }>(
  value: T,
  ctx: z.RefinementCtx,
) => {
  if (
    value.payType === 'SALARY' &&
    (value.monthlySalary === undefined || value.monthlySalary === null)
  ) {
    ctx.addIssue({ code: 'custom', path: ['monthlySalary'], message: 'validation.salaryRequired' });
  }
};

const UserFieldsSchema = z.object({
  fullName: z.string().trim().min(2, 'validation.required').max(120),
  role: RoleSchema,
  brigadeId: z.string().uuid().nullable().optional(),
  payType: PayTypeSchema.default('PIECE'),
  monthlySalary: z
    .number({ invalid_type_error: 'validation.money' })
    .int('validation.money')
    .min(0, 'validation.money')
    .nullable()
    .optional(),
  permissions: PermissionsSchema.optional(),
});

// POST /users — PIN (sewers) or a temporary password (others) is generated and sent by SMS/Telegram.
export const UserCreateRequestSchema = UserFieldsSchema.extend({ phone: PhoneSchema }).superRefine(
  salaryRule,
);
export type UserCreateRequest = z.input<typeof UserCreateRequestSchema>;

// PATCH /users/:id
export const UserUpdateRequestSchema = UserFieldsSchema.partial()
  .extend({
    isActive: z.boolean().optional(),
    twoFactorEnabled: z.boolean().optional(),
    locale: LocaleSchema.optional(),
  })
  .superRefine(salaryRule);
export type UserUpdateRequest = z.input<typeof UserUpdateRequestSchema>;

// POST /users — quick add from registration step 3.
export const UserQuickCreateRequestSchema = z.object({
  fullName: z.string().trim().min(2, 'validation.required').max(120),
  phone: PhoneSchema,
  role: RoleSchema.exclude(['OWNER', 'CLIENT']),
});
export type UserQuickCreateRequest = z.infer<typeof UserQuickCreateRequestSchema>;

export const UserListQuerySchema = z.object({
  q: z.string().trim().optional(),
  role: RoleSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type UserListQuery = z.input<typeof UserListQuerySchema>;

// PATCH /auth/me — the user's own preferences.
export const MeUpdateRequestSchema = z.object({ locale: LocaleSchema });
export type MeUpdateRequest = z.infer<typeof MeUpdateRequestSchema>;

export const BrigadeSchema = z.object({
  id: z.string(),
  name: z.string(),
  foremanId: z.string().nullable(),
  membersCount: z.number().int(),
});
export type Brigade = z.infer<typeof BrigadeSchema>;

export const BrigadeCreateRequestSchema = z.object({
  name: z.string().trim().min(1, 'validation.required').max(80),
  foremanId: z.string().uuid().nullable().optional(),
});
export type BrigadeCreateRequest = z.infer<typeof BrigadeCreateRequestSchema>;
