import type { ApiError, ErrorCode } from '@tigu/shared';
import { HttpResponse } from 'msw';
import type { ZodType, ZodTypeDef } from 'zod';

export const API = '*/api/v1';

export function apiError(
  status: number,
  code: ErrorCode,
  message: string,
  details?: Record<string, unknown>,
) {
  const body: ApiError = { error: details ? { code, message, details } : { code, message } };
  return HttpResponse.json(body, { status });
}

/** Parses a JSON body with a shared zod schema; returns a 400 response on failure. */
export async function parseBody<T>(
  request: Request,
  schema: ZodType<T, ZodTypeDef, unknown>,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  const json: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse(json);
  if (parsed.success) return { ok: true, data: parsed.data };
  return {
    ok: false,
    response: apiError(400, 'VALIDATION_ERROR', 'Request validation failed', {
      issues: parsed.error.issues,
    }),
  };
}
