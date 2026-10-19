/** `pnpm db:migrate` — apply migrations and grants to an already running database. */
import { env } from '../src/config/env';
import { setupDatabase } from './db-setup';

await setupDatabase({
  adminUrl: env.DATABASE_ADMIN_URL,
  appUrl: env.DATABASE_URL,
  appUser: env.PG_APP_USER,
  appPassword: env.PG_APP_PASSWORD,
  log: (message) => console.log(`[db] ${message}`),
});
console.log('[db] done');
