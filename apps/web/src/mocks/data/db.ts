import type { AuthUser, Locale, Permissions, Role } from '@tigu/shared';

// In-memory fake backend for MSW. Demo credentials are listed in the README.

export interface MockUser {
  id: string;
  tenantId: string;
  fullName: string;
  phone: string;
  role: Role;
  permissions: Permissions;
  locale: Locale;
  password?: string;
  pin?: string;
  twoFactor: boolean;
  failedPinCount: number;
  lockedUntil: number | null;
}

export interface MockTenant {
  id: string;
  name: string;
}

export interface MockChallenge {
  id: string;
  phone: string;
  userId: string | null;
  purpose: '2fa' | 'otp';
  code: string;
  expiresAt: number;
  attempts: number;
}

export const DEMO_PASSWORD = 'demo1234';
export const DEMO_PIN = '1234';
export const DEMO_CODE = '123456';

const DEMO_TENANT: MockTenant = { id: 't-demo', name: 'Демо цех' };

function demoUser(
  n: number,
  role: Role,
  fullName: string,
  extra: Partial<MockUser> = {},
): MockUser {
  return {
    id: `u-${role.toLowerCase()}`,
    tenantId: DEMO_TENANT.id,
    fullName,
    phone: `+99655500000${n}`,
    role,
    permissions: {},
    locale: 'ky',
    password: role === 'SEWER' ? undefined : DEMO_PASSWORD,
    twoFactor: role !== 'SEWER' && role !== 'CLIENT',
    failedPinCount: 0,
    lockedUntil: null,
    ...extra,
  };
}

const STORAGE_KEY = 'tigu.mock.db';

interface DbState {
  tenants: MockTenant[];
  users: MockUser[];
  sessionUserId: string | null;
}

function initialState(): DbState {
  return {
    tenants: [DEMO_TENANT],
    users: [
      demoUser(1, 'OWNER', 'Бакыт Асанов'),
      demoUser(2, 'TECHNOLOGIST', 'Нурия Садыкова', { permissions: { canSeePrices: true } }),
      demoUser(3, 'FOREMAN', 'Эрмек Жумабеков'),
      demoUser(4, 'CUTTER', 'Талант Осмонов'),
      demoUser(5, 'SEWER', 'Айгүл Токтогулова', { pin: DEMO_PIN }),
      demoUser(6, 'STOREKEEPER', 'Гүлнара Исаева'),
      demoUser(7, 'ACCOUNTANT', 'Жылдыз Мамытова'),
      demoUser(8, 'CLIENT', 'ОсОО «Ала-Тоо Текстиль»', { locale: 'ru' }),
    ],
    sessionUserId: null,
  };
}

function load(): DbState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DbState;
  } catch {
    // Storage unavailable (tests, private mode): start from the seed.
  }
  return initialState();
}

let state = load();
const challenges = new Map<string, MockChallenge>();

function persist() {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

let seq = 0;
export const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(seq++).toString(36)}`;

export const db = {
  reset() {
    state = initialState();
    challenges.clear();
    persist();
  },
  findUserByPhone: (phone: string) => state.users.find((u) => u.phone === phone),
  findUser: (id: string) => state.users.find((u) => u.id === id),
  addTenant(tenant: MockTenant) {
    state.tenants.push(tenant);
    persist();
  },
  addUser(user: MockUser) {
    state.users.push(user);
    persist();
  },
  updateUser(id: string, patch: Partial<MockUser>) {
    state.users = state.users.map((u) => (u.id === id ? { ...u, ...patch } : u));
    persist();
  },
  getSession: () => state.sessionUserId,
  setSession(userId: string | null) {
    state.sessionUserId = userId;
    persist();
  },
  createChallenge(input: Omit<MockChallenge, 'id' | 'expiresAt' | 'attempts' | 'code'>) {
    const challenge: MockChallenge = {
      ...input,
      id: newId('ch'),
      code: DEMO_CODE,
      expiresAt: Date.now() + 5 * 60_000,
      attempts: 0,
    };
    challenges.set(challenge.id, challenge);
    console.info(`[mock] code for ${input.phone}: ${challenge.code}`);
    return challenge;
  },
  getChallenge: (id: string) => challenges.get(id),
  deleteChallenge: (id: string) => challenges.delete(id),
  toAuthUser(user: MockUser): AuthUser {
    const tenant = state.tenants.find((t) => t.id === user.tenantId) ?? DEMO_TENANT;
    return {
      id: user.id,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
      permissions: user.permissions,
      locale: user.locale,
      tenant: { id: tenant.id, name: tenant.name },
    };
  },
};
