/**
 * Blocks until the app role can read a migrated table — i.e. the DB is up, migrated and granted.
 * Lets `pnpm dev` start the DB and the API in parallel without a race.
 */
import pg from 'pg';
import { env } from '../src/config/env';

const deadline = Date.now() + 120_000;

for (;;) {
  const client = new pg.Client({ connectionString: env.DATABASE_URL });
  try {
    await client.connect();
    await client.query('SELECT 1 FROM "Tenant" LIMIT 1');
    await client.end();
    break;
  } catch {
    await client.end().catch(() => undefined);
    if (Date.now() > deadline) {
      console.error('[api] database did not become ready within 120s');
      process.exit(1);
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}
