import { defineConfig } from 'vitest/config';
import { TEST_DB } from './test/testDb';

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./test/globalSetup.ts'],
    // One shared database: run files one after another.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 120_000,
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      DATABASE_URL: TEST_DB.appUrl,
      DATABASE_ADMIN_URL: TEST_DB.adminUrl,
      AUTH_RATE_LIMIT_MAX: '1000',
    },
  },
});
