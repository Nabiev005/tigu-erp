/**
 * Starts a throwaway PostgreSQL for integration tests (spec §16: separate test database),
 * applies migrations and grants, and removes everything afterwards.
 */
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import EmbeddedPostgres from 'embedded-postgres';
import { createUtf8Database, setupDatabase } from '../scripts/db-setup';
import { TEST_DB } from './testDb';

export default async function globalSetup() {
  const dataDir = mkdtempSync(join(tmpdir(), 'tigu-test-pg-'));
  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    port: TEST_DB.port,
    user: TEST_DB.adminUser,
    password: TEST_DB.adminPassword,
    persistent: false,
    onLog: () => {},
  });
  await pg.initialise();
  await pg.start();
  await createUtf8Database(TEST_DB.adminUrl, TEST_DB.database);
  await setupDatabase({
    adminUrl: TEST_DB.adminUrl,
    appUrl: TEST_DB.appUrl,
    appUser: TEST_DB.appUser,
    appPassword: TEST_DB.appPassword,
  });

  return async () => {
    await pg.stop();
    try {
      // On Windows postgres may hold file handles for a moment after stop().
      rmSync(dataDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 });
    } catch (error) {
      console.warn(`[test db] could not remove ${dataDir}; the OS temp cleanup will`, error);
    }
  };
}
