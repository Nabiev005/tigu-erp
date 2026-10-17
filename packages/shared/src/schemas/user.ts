import { z } from 'zod';
import { RoleSchema } from '../enums';
import { PhoneSchema } from './auth';

// POST /users — quick add (registration step 3). Full form arrives with settings in stage 2.
export const UserQuickCreateRequestSchema = z.object({
  fullName: z.string().trim().min(2, 'validation.required').max(120),
  phone: PhoneSchema,
  role: RoleSchema.exclude(['OWNER', 'CLIENT']),
});
export type UserQuickCreateRequest = z.infer<typeof UserQuickCreateRequestSchema>;
