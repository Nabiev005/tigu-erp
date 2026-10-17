import {
  LeadRequestSchema,
  ModelCreateRequestSchema,
  UserQuickCreateRequestSchema,
} from '@tigu/shared';
import { HttpResponse, http } from 'msw';
import { db, newId } from '../data/db';
import { authHandlers } from './auth';
import { API, apiError, parseBody } from './utils';

function requireSession(request: Request) {
  const userId = request.headers.get('Authorization')?.replace('Bearer mock-access-', '');
  return userId ? db.findUser(userId) : undefined;
}

const otherHandlers = [
  http.post(`${API}/leads`, async ({ request }) => {
    const body = await parseBody(request, LeadRequestSchema);
    if (!body.ok) return body.response;
    console.info('[mock] new lead → Telegram admin notification', body.data);
    return HttpResponse.json({ id: newId('lead') }, { status: 201 });
  }),

  http.post(`${API}/models`, async ({ request }) => {
    if (!requireSession(request)) return apiError(401, 'UNAUTHORIZED', 'Not signed in');
    const body = await parseBody(request, ModelCreateRequestSchema);
    if (!body.ok) return body.response;
    return HttpResponse.json({ id: newId('m') }, { status: 201 });
  }),

  http.post(`${API}/models/import`, ({ request }) => {
    if (!requireSession(request)) return apiError(401, 'UNAUTHORIZED', 'Not signed in');
    return HttpResponse.json({ imported: 0 }, { status: 201 });
  }),

  http.post(`${API}/users`, async ({ request }) => {
    const actor = requireSession(request);
    if (!actor) return apiError(401, 'UNAUTHORIZED', 'Not signed in');
    if (actor.role !== 'OWNER') return apiError(403, 'FORBIDDEN', 'Only OWNER can add users');
    const body = await parseBody(request, UserQuickCreateRequestSchema);
    if (!body.ok) return body.response;
    if (db.findUserByPhone(body.data.phone)) return apiError(409, 'PHONE_TAKEN', 'Phone taken');
    const id = newId('u');
    const pin =
      body.data.role === 'SEWER' ? String(Math.floor(1000 + Math.random() * 9000)) : undefined;
    db.addUser({
      id,
      tenantId: actor.tenantId,
      ...body.data,
      permissions: {},
      locale: 'ky',
      pin,
      twoFactor: body.data.role !== 'SEWER',
      failedPinCount: 0,
      lockedUntil: null,
    });
    if (pin) console.info(`[mock] PIN for ${body.data.phone} sent via SMS/Telegram: ${pin}`);
    return HttpResponse.json({ id }, { status: 201 });
  }),
];

export const handlers = [...authHandlers, ...otherHandlers];
