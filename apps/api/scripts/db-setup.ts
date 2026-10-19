/**
 * Prepares a database for the API:
 *   1. ensures the non-owner app role exists (RLS does not apply to owners/superusers),
 *   2. applies Prisma migrations as the owner,
 *   3. grants the app role DML rights on every table.
 * Used by `pnpm dev`, `pnpm db:migrate` and the integration-test global setup.
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const apiDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export interface SetupOptions {
  adminUrl: string;
  appUrl: string;
  appUser: string;
  appPassword: string;
  log?: (message: string) => void;
}

function prismaCli(): string {
  const require = createRequire(import.meta.url);
  return join(dirname(require.resolve('prisma/package.json')), 'build', 'index.js');
}

export function runMigrations(adminUrl: string, appUrl: string): void {
  execFileSync(process.execPath, [prismaCli(), 'migrate', 'deploy'], {
    cwd: apiDir,
    env: { ...process.env, DATABASE_ADMIN_URL: adminUrl, DATABASE_URL: appUrl },
    stdio: 'pipe',
  });
}

/**
 * Creates the database with UTF8 encoding if it does not exist.
 * The cluster itself may use the OS code page (initdb on a Russian Windows picks WIN1251, and
 * forcing UTF8 at initdb fails when the install path has Cyrillic letters). Encoding is
 * per-database, so a UTF8 database with the C locale stores ң/ө/ү correctly either way.
 */
export async function createUtf8Database(adminUrl: string, name: string): Promise<void> {
  const url = new URL(adminUrl);
  url.pathname = '/postgres';
  const client = new pg.Client({ connectionString: url.toString() });
  await client.connect();
  try {
    const exists = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [name]);
    if (exists.rowCount === 0) {
      await client.query(
        `CREATE DATABASE ${client.escapeIdentifier(name)} ENCODING 'UTF8' LC_COLLATE 'C' LC_CTYPE 'C' TEMPLATE template0`,
      );
    }
  } finally {
    await client.end();
  }
}

export async function setupDatabase(opts: SetupOptions): Promise<void> {
  const log = opts.log ?? (() => {});
  const client = new pg.Client({ connectionString: opts.adminUrl });
  await client.connect();
  try {
    const encoding = (await client.query('SHOW server_encoding')).rows[0]?.server_encoding;
    if (encoding !== 'UTF8') {
      throw new Error(
        `Database encoding is ${encoding}, expected UTF8 (Kyrgyz letters ң/ө/ү need it). ` +
          'Recreate the database with ENCODING UTF8.',
      );
    }
    const role = client.escapeIdentifier(opts.appUser);
    const password = client.escapeLiteral(opts.appPassword);
    const exists = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [opts.appUser]);
    if (exists.rowCount === 0) {
      log(`creating role ${opts.appUser}`);
      await client.query(`CREATE ROLE ${role} LOGIN PASSWORD ${password} NOSUPERUSER NOBYPASSRLS`);
    }

    log('applying migrations');
    runMigrations(opts.adminUrl, opts.appUrl);

    const db = client.escapeIdentifier(
      (await client.query('SELECT current_database() AS d')).rows[0].d,
    );
    await client.query(`GRANT CONNECT ON DATABASE ${db} TO ${role}`);
    await client.query(`GRANT USAGE ON SCHEMA public TO ${role}`);
    await client.query(
      `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${role}`,
    );
    await client.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${role}`);
    // The app never needs to see migration bookkeeping.
    await client.query(`REVOKE ALL ON TABLE "_prisma_migrations" FROM ${role}`);
  } finally {
    await client.end();
  }
}
