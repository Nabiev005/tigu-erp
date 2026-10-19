import type { Prisma, User as DbUser } from '@prisma/client';
import type {
  Brigade,
  BrigadeCreateRequest,
  Paginated,
  User,
  UserCreateRequestSchema,
  UserListQuerySchema,
  UserUpdateRequestSchema,
} from '@tigu/shared';
import type { z } from 'zod';
import { message } from '../../i18n';
import { systemDb, type TenantDb } from '../../lib/db';
import { generatePin, generateTempPassword, hashSecret } from '../../lib/password';
import type { AuthContext } from '../../plugins/auth';
import { parsePermissions } from '../../plugins/auth';
import { AppError, notFound } from '../../plugins/errors';
import { diff, recordAudit } from '../audit/service';
import { revokeAllSessions } from '../auth/service';
import type { MessageSender } from '../notifications/sender';

type CreateInput = z.output<typeof UserCreateRequestSchema>;
type UpdateInput = z.output<typeof UserUpdateRequestSchema>;
type ListQuery = z.output<typeof UserListQuerySchema>;

/** Roles that enter with a password get 2FA by default (spec §13: managers use 2FA). */
const TWO_FACTOR_BY_DEFAULT = (role: DbUser['role']) => role !== 'SEWER' && role !== 'CLIENT';

export function toUserDto(user: DbUser): User {
  return {
    id: user.id,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    permissions: parsePermissions(user.permissions),
    brigadeId: user.brigadeId,
    payType: user.payType,
    monthlySalary: user.monthlySalary,
    locale: user.locale,
    twoFactorEnabled: user.twoFactorEnabled,
    isActive: user.isActive,
    telegramLinked: Boolean(user.telegramChatId),
    pinLocked: Boolean(user.lockedUntil && user.lockedUntil.getTime() > Date.now()),
    createdAt: user.createdAt.toISOString(),
  };
}

/** Fields worth keeping in the audit trail (no hashes). */
const auditView = (u: User) => ({
  fullName: u.fullName,
  role: u.role,
  permissions: u.permissions,
  brigadeId: u.brigadeId,
  payType: u.payType,
  monthlySalary: u.monthlySalary,
  isActive: u.isActive,
  twoFactorEnabled: u.twoFactorEnabled,
  locale: u.locale,
});

export function usersService(db: TenantDb, auth: AuthContext, sender: MessageSender) {
  async function tenantName() {
    return (await db.tenant.findFirst({ select: { name: true } }))?.name ?? '';
  }

  async function assertBrigade(brigadeId: string | null | undefined) {
    if (!brigadeId) return;
    if (!(await db.brigade.findFirst({ where: { id: brigadeId }, select: { id: true } }))) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Unknown brigade', { field: 'brigadeId' });
    }
  }

  /** Generates the right credential for the role and sends it to the user. */
  async function issueCredential(
    user: Pick<DbUser, 'phone' | 'role' | 'locale' | 'telegramChatId'>,
  ) {
    const tenant = await tenantName();
    if (user.role === 'SEWER') {
      const pin = generatePin();
      await sender.send({
        phone: user.phone,
        channel: user.telegramChatId ? 'telegram' : 'sms',
        telegramChatId: user.telegramChatId,
        text: message(user.locale, 'pin', { pin, tenant }),
      });
      return { pinHash: await hashSecret(pin), failedPinCount: 0, lockedUntil: null };
    }
    const password = generateTempPassword();
    await sender.send({
      phone: user.phone,
      channel: user.telegramChatId ? 'telegram' : 'sms',
      telegramChatId: user.telegramChatId,
      text: message(user.locale, 'password', { password, tenant }),
    });
    return { passwordHash: await hashSecret(password) };
  }

  return {
    async list(query: ListQuery): Promise<Paginated<User>> {
      const where: Prisma.UserWhereInput = {
        ...(query.role ? { role: query.role } : {}),
        ...(query.q
          ? {
              OR: [
                { fullName: { contains: query.q, mode: 'insensitive' } },
                { phone: { contains: query.q.replace(/\s/g, '') } },
              ],
            }
          : {}),
      };
      const [total, rows] = await Promise.all([
        db.user.count({ where }),
        db.user.findMany({
          where,
          orderBy: [{ isActive: 'desc' }, { fullName: 'asc' }],
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
      ]);
      return { items: rows.map(toUserDto), total, page: query.page, pageSize: query.pageSize };
    },

    async create(input: CreateInput): Promise<User> {
      // One phone = one account across the platform: login by phone stays unambiguous.
      if ((await systemDb().user.count({ where: { phone: input.phone } })) > 0) {
        throw new AppError(409, 'PHONE_TAKEN', 'Phone already registered');
      }
      await assertBrigade(input.brigadeId);
      const credential = await issueCredential({
        phone: input.phone,
        role: input.role,
        locale: 'ky',
        telegramChatId: null,
      });
      const user = await db.user.create({
        data: {
          tenantId: auth.tenantId,
          fullName: input.fullName,
          phone: input.phone,
          role: input.role,
          brigadeId: input.brigadeId ?? null,
          payType: input.payType,
          monthlySalary: input.payType === 'SALARY' ? (input.monthlySalary ?? null) : null,
          permissions: input.permissions ?? {},
          twoFactorEnabled: TWO_FACTOR_BY_DEFAULT(input.role),
          ...credential,
        },
      });
      const dto = toUserDto(user);
      await recordAudit(db, auth, {
        action: 'user.create',
        entity: 'User',
        entityId: user.id,
        after: auditView(dto),
      });
      return dto;
    },

    async update(id: string, input: UpdateInput): Promise<User> {
      const current = await db.user.findFirst({ where: { id } });
      if (!current) throw notFound('User');
      const self = id === auth.userId;
      if (self && ((input.role && input.role !== current.role) || input.isActive === false)) {
        throw new AppError(
          403,
          'CANNOT_MODIFY_SELF',
          'You cannot change your own role or deactivate yourself',
        );
      }
      await assertBrigade(input.brigadeId);

      const role = input.role ?? current.role;
      const payType = input.payType ?? current.payType;
      // A new role may need a credential the user never had (PIN ↔ password).
      const needsPin = role === 'SEWER' && !current.pinHash;
      const needsPassword = role !== 'SEWER' && !current.passwordHash;
      const credential =
        needsPin || needsPassword ? await issueCredential({ ...current, role }) : {};

      const updated = await db.user.update({
        where: { id },
        data: {
          fullName: input.fullName,
          role: input.role,
          brigadeId: input.brigadeId,
          payType: input.payType,
          monthlySalary:
            payType === 'SALARY' ? (input.monthlySalary ?? current.monthlySalary) : null,
          permissions: input.permissions,
          isActive: input.isActive,
          twoFactorEnabled: input.twoFactorEnabled,
          locale: input.locale,
          ...credential,
        },
      });
      if (current.isActive && !updated.isActive) await revokeAllSessions(id);

      const before = toUserDto(current);
      const after = toUserDto(updated);
      const changes = diff(auditView(before), auditView(after));
      if (changes.changed) {
        await recordAudit(db, auth, {
          action: 'user.update',
          entity: 'User',
          entityId: id,
          before: changes.before,
          after: changes.after,
        });
      }
      return after;
    },

    async resetPin(id: string): Promise<User> {
      const user = await db.user.findFirst({ where: { id } });
      if (!user) throw notFound('User');
      if (user.role !== 'SEWER') throw new AppError(400, 'NOT_A_SEWER', 'Only sewers have a PIN');
      const credential = await issueCredential(user);
      const updated = await db.user.update({ where: { id }, data: credential });
      await recordAudit(db, auth, { action: 'user.resetPin', entity: 'User', entityId: id });
      return toUserDto(updated);
    },

    async listBrigades(): Promise<Brigade[]> {
      const rows = await db.brigade.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { members: true } } },
      });
      return rows.map((b) => ({
        id: b.id,
        name: b.name,
        foremanId: b.foremanId,
        membersCount: b._count.members,
      }));
    },

    async createBrigade(input: BrigadeCreateRequest): Promise<Brigade> {
      if (input.foremanId) {
        const foreman = await db.user.findFirst({
          where: { id: input.foremanId, role: 'FOREMAN' },
        });
        if (!foreman) {
          throw new AppError(400, 'VALIDATION_ERROR', 'Foreman not found', { field: 'foremanId' });
        }
      }
      const brigade = await db.brigade.create({
        data: { tenantId: auth.tenantId, name: input.name, foremanId: input.foremanId ?? null },
      });
      await recordAudit(db, auth, {
        action: 'brigade.create',
        entity: 'Brigade',
        entityId: brigade.id,
        after: { name: brigade.name, foremanId: brigade.foremanId },
      });
      return { id: brigade.id, name: brigade.name, foremanId: brigade.foremanId, membersCount: 0 };
    },
  };
}
