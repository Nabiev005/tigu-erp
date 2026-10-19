import { LeadRequestSchema, ModelCreateRequestSchema } from '@tigu/shared';
import { HttpResponse, http } from 'msw';
import { newId } from '../data/db';
import { authHandlers } from './auth';
import { settingsHandlers } from './settings';
import { API, apiError, parseBody } from './utils';

const leadHandlers = [
  http.post(`${API}/leads`, async ({ request }) => {
    const body = await parseBody(request, LeadRequestSchema);
    if (!body.ok) return body.response;
    return HttpResponse.json({ id: newId('lead') }, { status: 201 });
  }),
];

/** Endpoints the real API does not have yet (models: stage 3). */
const notYetBuiltHandlers = [
  http.post(`${API}/models`, async ({ request }) => {
    if (!request.headers.get('Authorization'))
      return apiError(401, 'UNAUTHORIZED', 'Not signed in');
    const body = await parseBody(request, ModelCreateRequestSchema);
    if (!body.ok) return body.response;
    return HttpResponse.json({ id: newId('m') }, { status: 201 });
  }),

  http.post(`${API}/models/import`, ({ request }) => {
    if (!request.headers.get('Authorization'))
      return apiError(401, 'UNAUTHORIZED', 'Not signed in');
    return HttpResponse.json({ imported: 0 }, { status: 201 });
  }),
];

/** Full fake backend for UI tests (no API server needed). */
export const handlers = [
  ...authHandlers,
  ...settingsHandlers,
  ...leadHandlers,
  ...notYetBuiltHandlers,
];

/**
 * Browser dev mode: everything the real API already serves goes through to it
 * (auth, users, settings, leads); MSW only fills in modules from later stages.
 */
export const browserHandlers = notYetBuiltHandlers;
