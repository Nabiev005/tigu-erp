// Generates the custom SQL appended to the init migration (partial unique index + RLS).
// Usage: node prisma/rls.sql.mjs >> prisma/migrations/<name>/migration.sql
export const TENANT_TABLES = [
  'User',
  'Brigade',
  'Customer',
  'OperationRef',
  'Model',
  'TechCard',
  'Order',
  'CuttingTask',
  'Bundle',
  'WorkRecord',
  'PayrollPeriod',
  'PayrollAdjustment',
  'AuditLog',
  'Counter',
  'Material',
  'Supplier',
  'StockMovement',
  'Defect',
];

const cond = (col) =>
  `current_setting('app.bypass_rls', true) = 'on' OR "${col}" = current_setting('app.tenant_id', true)`;

const policy = (table, col) => `
ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "${table}" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "${table}"
  USING (${cond(col)})
  WITH CHECK (${cond(col)});
`;

let sql = `
-- ---------------------------------------------------------------------------
-- Spec §7.1: one operation of one bundle is recorded once (cancelled scans excluded).
CREATE UNIQUE INDEX "work_record_once" ON "WorkRecord"("bundleId", "techCardOperationId")
  WHERE "cancelledAt" IS NULL;

-- ---------------------------------------------------------------------------
-- Spec §13: Row Level Security. The API connects as a non-owner role and sets, per transaction,
--   app.tenant_id  — the tenant of the signed-in user, or
--   app.bypass_rls — 'on' only for system flows (login, registration, refresh tokens).
-- Without either setting no tenant row is visible.
`;
sql += policy('Tenant', 'id');
for (const table of TENANT_TABLES) sql += policy(table, 'tenantId');

process.stdout.write(sql);
