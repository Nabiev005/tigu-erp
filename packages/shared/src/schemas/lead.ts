import { z } from 'zod';
import { PhoneSchema } from './auth';

// POST /leads — demo request from the public site.
export const LeadRequestSchema = z.object({
  name: z.string().trim().min(2, 'validation.required').max(120),
  phone: PhoneSchema,
  employeesCount: z.coerce
    .number({ invalid_type_error: 'validation.employeesCount' })
    .int('validation.employeesCount')
    .min(1, 'validation.employeesCount')
    .max(1000, 'validation.employeesCount'),
});
export type LeadRequest = z.infer<typeof LeadRequestSchema>;
