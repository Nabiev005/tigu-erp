import { buildApp } from './app';
import { env } from './config/env';
import { disconnectDb } from './lib/db';

const app = await buildApp({ env });
app.addHook('onClose', () => disconnectDb());

const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'shutting down');
  await app.close();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

try {
  await app.listen({ host: env.API_HOST, port: env.API_PORT });
} catch (error) {
  app.log.fatal(error);
  process.exit(1);
}
