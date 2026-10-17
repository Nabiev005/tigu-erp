import { ApiErrorSchema } from '@tigu/shared';
import type { ZodType, ZodTypeDef } from 'zod';
import { env } from '../config/env';
import { tokenStore } from './tokenStore';
import { ApiClientError, NETWORK_ERROR } from './types';

const API_PREFIX = '/api/v1';

type Method = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface RequestOptions<T> {
  method?: Method;
  body?: unknown;
  /** Validates the response; the client returns the parsed value. */
  schema?: ZodType<T, ZodTypeDef, unknown>;
  signal?: AbortSignal;
  /** Skip the 401 → refresh → retry cycle (used by auth endpoints themselves). */
  skipRefresh?: boolean;
}

let refreshHandler: (() => Promise<boolean>) | null = null;
let refreshInFlight: Promise<boolean> | null = null;

/** AuthProvider registers how to refresh the session; the client calls it on 401. */
export function setRefreshHandler(handler: (() => Promise<boolean>) | null): void {
  refreshHandler = handler;
}

async function refreshOnce(): Promise<boolean> {
  if (!refreshHandler) return false;
  refreshInFlight ??= refreshHandler().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

async function toApiError(res: Response): Promise<ApiClientError> {
  const json: unknown = await res.json().catch(() => null);
  const parsed = ApiErrorSchema.safeParse(json);
  if (parsed.success) {
    const { code, message, details } = parsed.data.error;
    return new ApiClientError(res.status, code, message, details);
  }
  return new ApiClientError(res.status, 'INTERNAL_ERROR', res.statusText);
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestOptions<T> = {},
): Promise<T> {
  const { method = 'GET', body, schema, signal, skipRefresh } = options;
  const isForm = body instanceof FormData;

  const send = () => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
    return fetch(`${env.apiBaseUrl}${API_PREFIX}${path}`, {
      method,
      headers,
      credentials: 'include',
      signal,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  };

  let res: Response;
  try {
    res = await send();
    if (res.status === 401 && !skipRefresh && (await refreshOnce())) res = await send();
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    throw new ApiClientError(0, NETWORK_ERROR, 'Network request failed');
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;

  const json: unknown = await res.json();
  return schema ? schema.parse(json) : (json as T);
}

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions<T>, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...opts, method: 'GET' }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions<T>, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...opts, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions<T>, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...opts, method: 'PATCH', body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions<T>, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...opts, method: 'DELETE' }),
};
