import cors from '@fastify/cors';
import Fastify, { type FastifyServerOptions } from 'fastify';
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import type { Env } from './config/env';
import { tcpCheck, type ReadinessCheck } from './lib/readiness';
import { healthRoutes } from './modules/health/routes';
import { registerErrorHandlers } from './plugins/errors';

export interface BuildAppOptions {
  env: Env;
  /** Overrides readiness checks (used in tests). */
  readinessChecks?: ReadinessCheck[];
  logger?: FastifyServerOptions['logger'];
}

export async function buildApp({ env, readinessChecks, logger }: BuildAppOptions) {
  const app = Fastify({
    logger: logger ?? {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss' } }
          : undefined,
    },
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  registerErrorHandlers(app);

  await app.register(cors, { origin: env.CORS_ORIGINS, credentials: true });

  await app.register(healthRoutes, {
    checks: readinessChecks ?? [tcpCheck('postgres', env.DATABASE_URL)],
  });

  // Business modules are mounted under /api/v1 starting from stage 2.

  return app;
}
