import { z } from 'zod';

export const HealthResponseSchema = z.object({
  status: z.literal('ok'),
});
export type HealthResponse = z.infer<typeof HealthResponseSchema>;

export const ReadinessCheckSchema = z.object({
  name: z.string(),
  ok: z.boolean(),
  error: z.string().optional(),
});

export const ReadyResponseSchema = z.object({
  status: z.enum(['ok', 'fail']),
  checks: z.array(ReadinessCheckSchema),
});
export type ReadyResponse = z.infer<typeof ReadyResponseSchema>;
