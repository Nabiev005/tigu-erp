/**
 * Starts a local PostgreSQL 16 from node_modules (embedded-postgres): no Docker, no install.
 * Data persists in PG_DATA_DIR (relative to apps/api) between runs.
 */
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';
import { env } from '../src/config/env';

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

if (!firstRun && existsSync(pidFile)) {
  const pid = Number(readFileSync(pidFile, 'utf8').split('\n')[0]);
  if (Number.isInteger(pid) && isAlive(pid)) {
    // A server left over from a previous run still owns this data dir: reuse it.
    // Stay alive so `concurrently -k` does not treat the exit as a crash.
    console.log(`[db] PostgreSQL already running (pid ${pid}) on localhost:${env.PG_PORT}`);
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
if (firstRun) await pg.createDatabase(env.PG_DATABASE);

console.log(`[db] PostgreSQL ready on localhost:${env.PG_PORT} (db: ${env.PG_DATABASE})`);

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
