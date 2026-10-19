import { describe, expect, it } from 'vitest';
import { prismaBase, tenantDb, tenantTransaction } from '../src/lib/db';
import { bearer, createTenant, createUser, tokenFor, useTestApp } from './helpers';

const ctx = useTestApp();

async function twoTenants() {
  const a = await createTenant('A цех');
  const b = await createTenant('B цех');
  const aSewer = await createUser(a.tenant.id, { role: 'SEWER', fullName: 'A тигүүчү' });
  const bSewer = await createUser(b.tenant.id, { role: 'SEWER', fullName: 'B тигүүчү' });
  return { a, b, aSewer, bSewer, aToken: tokenFor(ctx.app, a.owner) };
}

describe('tenant isolation — API (spec §13)', () => {
  it('lists only users of the caller’s tenant', async () => {
    const { aToken } = await twoTenants();
    const res = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/users',
      headers: bearer(aToken),
    });
    const names = res.json().items.map((u: { fullName: string }) => u.fullName);
    expect(names).toContain('A тигүүчү');
    expect(names).not.toContain('B тигүүчү');
    expect(res.json().total).toBe(2);
  });

  it('answers 404 for another tenant’s user, for reads and writes alike', async () => {
    const { aToken, bSewer } = await twoTenants();
    const patch = await ctx.app.inject({
      method: 'PATCH',
      url: `/api/v1/users/${bSewer.id}`,
      headers: bearer(aToken),
      payload: { fullName: 'Hacked' },
    });
    expect(patch.statusCode).toBe(404);
    const reset = await ctx.app.inject({
      method: 'POST',
      url: `/api/v1/users/${bSewer.id}/reset-pin`,
      headers: bearer(aToken),
    });
    expect(reset.statusCode).toBe(404);
    expect(
      (await tenantDb(bSewer.tenantId).user.findFirstOrThrow({ where: { id: bSewer.id } }))
        .fullName,
    ).toBe('B тигүүчү');
  });

  it('ignores a tenantId smuggled into the request body', async () => {
    const { a, b, aToken } = await twoTenants();
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/v1/brigades',
      headers: bearer(aToken),
      payload: { name: '1-бригада', tenantId: b.tenant.id },
    });
    expect(res.statusCode).toBe(201);
    const brigade = await prismaBase().$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.bypass_rls', 'on', true)`;
      return tx.brigade.findFirstOrThrow({ where: { id: res.json().id } });
    });
    expect(brigade.tenantId).toBe(a.tenant.id);
  });

  it('returns only the caller’s tenant settings and audit log', async () => {
    const { a, aToken } = await twoTenants();
    const tenant = await ctx.app.inject({
      method: 'GET',
      url: '/api/v1/tenant',
      headers: bearer(aToken),
    });
    expect(tenant.json().id).toBe(a.tenant.id);
  });
});

describe('tenant isolation — PostgreSQL RLS (defence in depth)', () => {
  it('hides other tenants even from raw SQL without a WHERE clause', async () => {
    const { a } = await twoTenants();
    const rows = await tenantTransaction(
      a.tenant.id,
      (tx) => tx.$queryRaw<{ fullName: string }[]>`SELECT "fullName" FROM "User"`,
    );
    expect(rows.map((r) => r.fullName).sort()).toEqual(['A тигүүчү', 'A цех ээси']);
  });

  it('blocks writes into another tenant', async () => {
    const { a, bSewer } = await twoTenants();
    const updated = await tenantTransaction(
      a.tenant.id,
      (tx) => tx.$executeRaw`UPDATE "User" SET "fullName" = 'Hacked' WHERE id = ${bSewer.id}`,
    );
    expect(updated).toBe(0);
    await expect(
      tenantTransaction(a.tenant.id, (tx) =>
        tx.brigade.create({ data: { tenantId: bSewer.tenantId, name: 'x' } }),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('shows nothing at all when no tenant is set', async () => {
    await twoTenants();
    const rows = await prismaBase().$queryRaw<{ n: bigint }[]>`SELECT count(*) AS n FROM "User"`;
    expect(Number(rows[0]?.n)).toBe(0);
  });
});
