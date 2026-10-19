import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import Fastify, { type FastifyServerOptions } from 'fastify';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import type { Env } from './config/env';
import { prismaBase } from './lib/db';
import type { ReadinessCheck } from './lib/readiness';
import { authRoutes } from './modules/auth/routes';
import { healthRoutes } from './modules/health/routes';
import { leadsRoutes } from './modules/leads/routes';
import { ConsoleMessageSender, type MessageSender } from './modules/notifications/sender';
import { settingsRoutes } from './modules/settings/routes';
import { usersRoutes } from './modules/users/routes';
import { authPlugin } from './plugins/auth';
import { registerErrorHandlers } from './plugins/errors';

export interface BuildAppOptions {
  env: Env;
  /** Overrides readiness checks (used in tests). */
  readinessChecks?: ReadinessCheck[];
  /** Delivers codes/PINs; defaults to the console in dev. Tests pass a MemoryMessageSender. */
  sender?: MessageSender;
  logger?: FastifyServerOptions['logger'];
}

const databaseCheck: ReadinessCheck = {
  name: 'postgres',
  run: async () => {
    await prismaBase().$queryRaw`SELECT 1`;
  },
};

export async function buildApp({ env, readinessChecks, sender, logger }: BuildAppOptions) {
  const app = Fastify({
    trustProxy: env.NODE_ENV === 'production',
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
  await app.register(rateLimit, {
    global: false,
    // After body parsing, so limits can be keyed by IP + phone.
    hook: 'preHandler',
    errorResponseBuilder: (_req, ctx) => ({
      statusCode: 429,
      code: 'TOO_MANY_ATTEMPTS',
      message: `Too many attempts, retry in ${Math.ceil(ctx.ttl / 1000)}s`,
    }),
  });

  await app.register(swagger, {
    openapi: {
      info: { title: 'ТигүүERP API', version: '1.0.0' },
      components: {
        securitySchemes: { bearer: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
      },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(swaggerUi, { routePrefix: '/api/docs' });

  await app.register(authPlugin, { env });
  await app.register(healthRoutes, { checks: readinessChecks ?? [databaseCheck] });

  const messageSender = sender ?? new ConsoleMessageSender(app.log);
  await app.register(
    async (api) => {
      await api.register(authRoutes, { env, sender: messageSender });
      await api.register(usersRoutes, { sender: messageSender });
      await api.register(settingsRoutes);
      await api.register(leadsRoutes);
    },
    { prefix: '/api/v1' },
  );

  return app;
}
