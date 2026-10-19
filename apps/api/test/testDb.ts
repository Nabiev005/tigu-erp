// Connection settings of the throwaway integration-test database.
const port = 5439;
const database = 'tigu_test';

export const TEST_DB = {
  port,
  database,
  adminUser: 'tigu',
  adminPassword: 'tigu',
  appUser: 'tigu_app',
  appPassword: 'tigu_app',
  adminUrl: `postgresql://tigu:tigu@localhost:${port}/${database}?schema=public`,
  appUrl: `postgresql://tigu_app:tigu_app@localhost:${port}/${database}?schema=public`,
} as const;
