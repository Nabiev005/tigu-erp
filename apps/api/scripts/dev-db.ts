/**
 * Starts a local PostgreSQL 16 from node_modules (embedded-postgres): no Docker, no install.
 * Data persists in PG_DATA_DIR (relative to apps/api) between runs.
 * After start it creates the app role, applies migrations and grants (scripts/db-setup.ts).
 */
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';
import { env } from '../src/config/env';
import { createUtf8Database, setupDatabase } from './db-setup';

const dataDir = resolve(process.cwd(), env.PG_DATA_DIR);
const firstRun = !existsSync(resolve(dataDir, 'PG_VERSION'));
const pidFile = resolve(dataDir, 'postmaster.pid');

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function prepare() {
  await setupDatabase({
    adminUrl: env.DATABASE_ADMIN_URL,
    appUrl: env.DATABASE_URL,
    appUser: env.PG_APP_USER,
    appPassword: env.PG_APP_PASSWORD,
    log: (message) => console.log(`[db] ${message}`),
  });
  console.log(`[db] PostgreSQL ready on localhost:${env.PG_PORT} (db: ${env.PG_DATABASE})`);
}

if (!firstRun && existsSync(pidFile)) {
  const pid = Number(readFileSync(pidFile, 'utf8').split('\n')[0]);
  if (Number.isInteger(pid) && isAlive(pid)) {
    // A server left over from a previous run still owns this data dir: reuse it.
    // Stay alive so `concurrently -k` does not treat the exit as a crash.
    console.log(`[db] PostgreSQL already running (pid ${pid}) on localhost:${env.PG_PORT}`);
    await prepare();
    setInterval(() => {}, 1 << 30);
    await new Promise<never>(() => {});
  }
  // A hard kill can leave a stale lock file behind.
  rmSync(pidFile);
}

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  port: env.PG_PORT,
  user: env.PG_USER,
  password: env.PG_PASSWORD,
  persistent: true,
  onLog: () => {},
});

if (firstRun) {
  console.log(`[db] initialising cluster in ${dataDir}`);
  await pg.initialise();
}
await pg.start();
await createUtf8Database(env.DATABASE_ADMIN_URL, env.PG_DATABASE);

let stopping = false;
const stop = async () => {
  if (stopping) return;
  stopping = true;
  console.log('[db] stopping');
  await pg.stop();
  process.exit(0);
};
process.on('SIGINT', () => void stop());
process.on('SIGTERM', () => void stop());

try {
  await prepare();
} catch (error) {
  console.error('[db] setup failed', error);
  await stop();
}
