import { z } from 'zod';
import { LocaleSchema, RoleSchema } from '../enums';
import { PermissionsSchema } from '../permissions';

// Validation messages are i18n keys, translated on the client.

/** E.164, e.g. +996555123456. */
export const PhoneSchema = z.string().regex(/^\+[1-9]\d{9,14}$/, 'validation.phone');
export const PasswordSchema = z.string().min(8, 'validation.passwordMin').max(128);
export const PinSchema = z.string().regex(/^\d{4}$/, 'validation.pin');
export const CodeSchema = z.string().regex(/^\d{6}$/, 'validation.code');

export const OtpChannelSchema = z.enum(['telegram', 'sms']);
export type OtpChannel = z.infer<typeof OtpChannelSchema>;

export const AuthUserSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  phone: PhoneSchema,
  role: RoleSchema,
  permissions: PermissionsSchema,
  locale: LocaleSchema,
  tenant: z.object({ id: z.string(), name: z.string() }),
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const SessionSchema = z.object({
  accessToken: z.string(),
  user: AuthUserSchema,
});
export type Session = z.infer<typeof SessionSchema>;

export const OtpChallengeSchema = z.object({
  challengeId: z.string(),
  channel: OtpChannelSchema,
  expiresAt: z.string().datetime(),
});
export type OtpChallenge = z.infer<typeof OtpChallengeSchema>;

// POST /auth/login
export const LoginRequestSchema = z.object({
  phone: PhoneSchema,
  password: z.string().min(1, 'validation.required'),
});
export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const LoginResponseSchema = z.discriminatedUnion('status', [
  OtpChallengeSchema.extend({ status: z.literal('2FA_REQUIRED') }),
  SessionSchema.extend({ status: z.literal('OK') }),
]);
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

// POST /auth/2fa/verify, POST /auth/otp/verify
export const CodeVerifyRequestSchema = z.object({
  challengeId: z.string(),
  code: CodeSchema,
});
export type CodeVerifyRequest = z.infer<typeof CodeVerifyRequestSchema>;

// POST /auth/pin
export const PinLoginRequestSchema = z.object({
  phone: PhoneSchema,
  pin: PinSchema,
});
export type PinLoginRequest = z.infer<typeof PinLoginRequestSchema>;

// POST /auth/otp/send
export const OtpSendRequestSchema = z.object({
  phone: PhoneSchema,
  channel: OtpChannelSchema,
});
export type OtpSendRequest = z.infer<typeof OtpSendRequestSchema>;

// POST /auth/register — creates the tenant and its owner, then sends a phone confirmation code.
export const RegisterRequestSchema = z.object({
  companyName: z.string().trim().min(2, 'validation.required').max(120),
  employeesCount: z.coerce
    .number({ invalid_type_error: 'validation.employeesCount' })
    .int('validation.employeesCount')
    .min(1, 'validation.employeesCount')
    .max(1000, 'validation.employeesCount'),
  city: z.string().trim().max(80).optional(),
  ownerFullName: z.string().trim().min(2, 'validation.required').max(120),
  phone: PhoneSchema,
  password: PasswordSchema,
  channel: OtpChannelSchema,
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'validation.terms' }) }),
});
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
