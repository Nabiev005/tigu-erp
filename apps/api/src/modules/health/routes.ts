import { HealthResponseSchema, ReadyResponseSchema, type ReadyResponse } from '@tigu/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import type { ReadinessCheck } from '../../lib/readiness';

export interface HealthRoutesOptions {
  checks: ReadinessCheck[];
}

export const healthRoutes: FastifyPluginAsyncZod<HealthRoutesOptions> = async (app, opts) => {
  app.get('/health', { schema: { response: { 200: HealthResponseSchema } } }, async () => ({
    status: 'ok' as const,
  }));

  app.get(
    '/ready',
    { schema: { response: { 200: ReadyResponseSchema, 503: ReadyResponseSchema } } },
    async (_request, reply) => {
      const checks: ReadyResponse['checks'] = await Promise.all(
        opts.checks.map(async (check) => {
          try {
            await check.run();
            return { name: check.name, ok: true };
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            return { name: check.name, ok: false, error: message };
          }
        }),
      );
      const ok = checks.every((c) => c.ok);
      return reply.status(ok ? 200 : 503).send({ status: ok ? 'ok' : 'fail', checks });
    },
  );
};
