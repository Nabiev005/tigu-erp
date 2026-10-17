import { z } from 'zod';

// POST /models — minimal shape for now; extended with tech cards in stage 3.
export const ModelCreateRequestSchema = z.object({
  article: z.string().trim().min(1, 'validation.required').max(40),
  name: z.string().trim().min(1, 'validation.required').max(120),
  sizes: z.array(z.string().trim().min(1)).min(1, 'validation.sizes'),
});
export type ModelCreateRequest = z.infer<typeof ModelCreateRequestSchema>;
