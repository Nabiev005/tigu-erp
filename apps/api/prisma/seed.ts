/**
 * `pnpm db:seed` — demo tenant "Демо цех" with one user per role (spec §16).
 * Passwords: demo1234, sewer PIN: 1234. Re-running replaces the demo tenant.
 * Models, orders, bundles and scans are added to the seed in their stages.
 */
import type { Role } from '@prisma/client';
import { env } from '../src/config/env';
import { disconnectDb, systemTransaction } from '../src/lib/db';
import { hashSecret } from '../src/lib/password';

const DEMO_TENANT_ID = '00000000-0000-4000-8000-000000000001';
export const DEMO_PASSWORD = 'demo1234';
export const DEMO_PIN = '1234';

const USERS: { role: Role; fullName: string; phone: string; twoFactor?: boolean }[] = [
  { role: 'OWNER', fullName: 'Бакыт Асанов', phone: '+996555000001', twoFactor: true },
  { role: 'TECHNOLOGIST', fullName: 'Нурия Садыкова', phone: '+996555000002' },
  { role: 'FOREMAN', fullName: 'Эрмек Жумабеков', phone: '+996555000003' },
  { role: 'CUTTER', fullName: 'Талант Осмонов', phone: '+996555000004' },
  { role: 'SEWER', fullName: 'Айгүл Токтогулова', phone: '+996555000005' },
  { role: 'STOREKEEPER', fullName: 'Гүлнара Исаева', phone: '+996555000006' },
  { role: 'ACCOUNTANT', fullName: 'Жылдыз Мамытова', phone: '+996555000007' },
  { role: 'CLIENT', fullName: 'Ала-Тоо Текстиль', phone: '+996555000008' },
  { role: 'SEWER', fullName: 'Мээрим Абдыкадырова', phone: '+996555000009' },
  { role: 'SEWER', fullName: 'Чолпон Бекова', phone: '+996555000010' },
];

async function main() {
  void env; // loads .env (DATABASE_URL)
  const [passwordHash, pinHash] = await Promise.all([
    hashSecret(DEMO_PASSWORD),
    hashSecret(DEMO_PIN),
  ]);

  await systemTransaction(async (tx) => {
    await tx.tenant.deleteMany({ where: { id: DEMO_TENANT_ID } });
    await tx.user.deleteMany({ where: { phone: { in: USERS.map((u) => u.phone) } } });
    await tx.tenant.create({
      data: { id: DEMO_TENANT_ID, name: 'Демо цех', city: 'Бишкек', employeesCount: 40 },
    });
    const created = new Map<string, string>();
    for (const u of USERS) {
      const user = await tx.user.create({
        data: {
          tenantId: DEMO_TENANT_ID,
          fullName: u.fullName,
          phone: u.phone,
          role: u.role,
          passwordHash: u.role === 'SEWER' ? null : passwordHash,
          pinHash: u.role === 'SEWER' ? pinHash : null,
          twoFactorEnabled: u.twoFactor ?? false,
          locale: u.role === 'CLIENT' ? 'ru' : 'ky',
          permissions: u.role === 'TECHNOLOGIST' ? { canSeePrices: true } : {},
          payType: u.role === 'SEWER' || u.role === 'CLIENT' ? 'PIECE' : 'SALARY',
          monthlySalary: u.role === 'SEWER' || u.role === 'CLIENT' ? null : 40_000_00,
        },
      });
      created.set(u.phone, user.id);
    }
    const brigade = await tx.brigade.create({
      data: {
        tenantId: DEMO_TENANT_ID,
        name: '1-бригада',
        foremanId: created.get('+996555000003'),
      },
    });
    await tx.user.updateMany({
      where: { tenantId: DEMO_TENANT_ID, role: { in: ['SEWER', 'FOREMAN'] } },
      data: { brigadeId: brigade.id },
    });
  });

  console.log(
    `Seeded "Демо цех": ${USERS.length} users (password ${DEMO_PASSWORD}, PIN ${DEMO_PIN})`,
  );
}

await main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDb());
