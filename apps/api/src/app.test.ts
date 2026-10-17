import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { buildApp } from './app';
import { parseEnv } from './config/env';

const env = parseEnv({ NODE_ENV: 'test', LOG_LEVEL: 'silent' });

describe('health endpoints', () => {
  let app: Awaited<ReturnType<typeof buildApp>>;
  let dbUp = true;

  beforeAll(async () => {
    app = await buildApp({
      env,
      logger: false,
      readinessChecks: [
        {
          name: 'postgres',
          run: async () => {
            if (!dbUp) throw new Error('connection refused');
          },
        },
      ],
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
  });

  it('GET /ready returns 200 when all checks pass', async () => {
    dbUp = true;
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok', checks: [{ name: 'postgres', ok: true }] });
  });

  it('GET /ready returns 503 when a check fails', async () => {
    dbUp = false;
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(503);
    expect(res.json()).toMatchObject({
      status: 'fail',
      checks: [{ name: 'postgres', ok: false, error: 'connection refused' }],
    });
  });

  it('unknown route returns the common error envelope', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/nope' });
    expect(res.statusCode).toBe(404);
    expect(res.json()).toMatchObject({ error: { code: 'NOT_FOUND' } });
  });
});
