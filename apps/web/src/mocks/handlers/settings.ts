import {
  BrigadeCreateRequestSchema,
  MeUpdateRequestSchema,
  TenantUpdateRequestSchema,
  UserCreateRequestSchema,
  UserUpdateRequestSchema,
} from '@tigu/shared';
import { HttpResponse, http } from 'msw';
import { db, newId, type MockUser } from '../data/db';
import { API, apiError, parseBody } from './utils';

// Mirrors apps/api users/settings modules closely enough for UI tests.

function actor(request: Request) {
  const userId = request.headers.get('Authorization')?.replace('Bearer mock-access-', '');
  return userId ? db.findUser(userId) : undefined;
}

function owner(request: Request): MockUser | Response {
  const user = actor(request);
  if (!user) return apiError(401, 'UNAUTHORIZED', 'Not signed in');
  if (user.role !== 'OWNER') return apiError(403, 'FORBIDDEN', 'Settings are OWNER-only');
  return user;
}

function audit(
  by: MockUser,
  action: string,
  entity: string,
  entityId: string,
  before: unknown,
  after: unknown,
) {
  db.addAudit({
    id: newId('a'),
    userId: by.id,
    userName: by.fullName,
    action,
    entity,
    entityId,
    before,
    after,
    createdAt: new Date().toISOString(),
  });
}

export const settingsHandlers = [
  http.get(`${API}/users`, ({ request }) => {
    const me = owner(request);
    if (me instanceof Response) return me;
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase() ?? '';
    const role = url.searchParams.get('role');
    const page = Number(url.searchParams.get('page') ?? 1);
    const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
    const all = db
      .listUsers(me.tenantId)
      .filter(
        (u) =>
          (!role || u.role === role) &&
          (!q || u.fullName.toLowerCase().includes(q) || u.phone.includes(q)),
      );
    return HttpResponse.json({
      items: all.slice((page - 1) * pageSize, page * pageSize).map(db.toUser),
      total: all.length,
      page,
      pageSize,
    });
  }),

  http.post(`${API}/users`, async ({ request }) => {
    const me = owner(request);
    if (me instanceof Response) return me;
    const body = await parseBody(request, UserCreateRequestSchema);
    if (!body.ok) return body.response;
    if (db.findUserByPhone(body.data.phone)) return apiError(409, 'PHONE_TAKEN', 'Phone taken');
    const user: MockUser = {
      id: newId('u'),
      tenantId: me.tenantId,
      fullName: body.data.fullName,
      phone: body.data.phone,
      role: body.data.role,
      permissions: body.data.permissions ?? {},
      locale: 'ky',
      twoFactor: body.data.role !== 'SEWER' && body.data.role !== 'CLIENT',
      failedPinCount: 0,
      lockedUntil: null,
      brigadeId: body.data.brigadeId ?? null,
      payType: body.data.payType,
      monthlySalary: body.data.monthlySalary ?? null,
      pin: body.data.role === 'SEWER' ? '1111' : undefined,
      password: body.data.role === 'SEWER' ? undefined : 'temp-pass',
    };
    db.addUser(user);
    audit(me, 'user.create', 'User', user.id, null, { fullName: user.fullName, role: user.role });
    return HttpResponse.json(db.toUser(user), { status: 201 });
  }),

  http.patch(`${API}/users/:id`, async ({ request, params }) => {
    const me = owner(request);
    if (me instanceof Response) return me;
    const current = db.findUser(String(params.id));
    if (!current || current.tenantId !== me.tenantId)
      return apiError(404, 'NOT_FOUND', 'Not found');
    const body = await parseBody(request, UserUpdateRequestSchema);
    if (!body.ok) return body.response;
    const { twoFactorEnabled, ...rest } = body.data;
    if (current.id === me.id && ((rest.role && rest.role !== me.role) || rest.isActive === false)) {
      return apiError(403, 'CANNOT_MODIFY_SELF', 'Cannot modify self');
    }
    db.updateUser(current.id, {
      ...rest,
      ...(twoFactorEnabled === undefined ? {} : { twoFactor: twoFactorEnabled }),
    } as Partial<MockUser>);
    const updated = db.findUser(current.id) ?? current;
    if (current.role !== updated.role) {
      audit(me, 'user.update', 'User', current.id, { role: current.role }, { role: updated.role });
    }
    return HttpResponse.json(db.toUser(updated));
  }),

  http.post(`${API}/users/:id/reset-pin`, ({ request, params }) => {
    const me = owner(request);
    if (me instanceof Response) return me;
    const user = db.findUser(String(params.id));
    if (!user || user.tenantId !== me.tenantId) return apiError(404, 'NOT_FOUND', 'Not found');
    if (user.role !== 'SEWER') return apiError(400, 'NOT_A_SEWER', 'Not a sewer');
    db.updateUser(user.id, { failedPinCount: 0, lockedUntil: null });
    audit(me, 'user.resetPin', 'User', user.id, null, null);
    return HttpResponse.json(db.toUser(db.findUser(user.id) ?? user));
  }),

  http.get(`${API}/brigades`, ({ request }) => {
    const me = owner(request);
    if (me instanceof Response) return me;
    return HttpResponse.json(db.brigades());
  }),

  http.post(`${API}/brigades`, async ({ request }) => {
    const me = owner(request);
    if (me instanceof Response) return me;
    const body = await parseBody(request, BrigadeCreateRequestSchema);
    if (!body.ok) return body.response;
    const brigade = {
      id: newId('b'),
      name: body.data.name,
      foremanId: body.data.foremanId ?? null,
      membersCount: 0,
    };
    db.addBrigade(brigade);
    return HttpResponse.json(brigade, { status: 201 });
  }),

  http.get(`${API}/tenant`, ({ request }) => {
    const me = owner(request);
    if (me instanceof Response) return me;
    return HttpResponse.json(db.tenant(me.tenantId));
  }),

  http.patch(`${API}/tenant`, async ({ request }) => {
    const me = owner(request);
    if (me instanceof Response) return me;
    const body = await parseBody(request, TenantUpdateRequestSchema);
    if (!body.ok) return body.response;
    const before = db.tenant(me.tenantId);
    db.updateTenant(me.tenantId, body.data);
    const after = db.tenant(me.tenantId);
    audit(
      me,
      'tenant.update',
      'Tenant',
      me.tenantId,
      { shiftHours: before.shiftHours },
      { shiftHours: after.shiftHours },
    );
    return HttpResponse.json(after);
  }),

  http.get(`${API}/audit-log`, ({ request }) => {
    const me = owner(request);
    if (me instanceof Response) return me;
    const entity = new URL(request.url).searchParams.get('entity');
    const items = db.audit().filter((e) => !entity || e.entity === entity);
    return HttpResponse.json({ items, total: items.length, page: 1, pageSize: 50 });
  }),

  http.patch(`${API}/auth/me`, async ({ request }) => {
    const me = actor(request);
    if (!me) return apiError(401, 'UNAUTHORIZED', 'Not signed in');
    const body = await parseBody(request, MeUpdateRequestSchema);
    if (!body.ok) return body.response;
    db.updateUser(me.id, { locale: body.data.locale });
    return HttpResponse.json(db.toAuthUser(db.findUser(me.id) ?? me));
  }),
];
