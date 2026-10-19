import {
  BrigadeCreateRequestSchema,
  BrigadeSchema,
  UserCreateRequestSchema,
  UserListQuerySchema,
  UserSchema,
  UserUpdateRequestSchema,
  paginated,
} from '@tigu/shared';
import type { FastifyRequest } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { requireSection } from '../../plugins/auth';
import type { MessageSender } from '../notifications/sender';
import { usersService } from './service';

const IdParams = z.object({ id: z.string().uuid() });
const security = [{ bearer: [] }];

/** Users and brigades are managed from Settings, which only OWNER opens (spec §5, §9 2.10). */
export const usersRoutes: FastifyPluginAsyncZod<{ sender: MessageSender }> = async (app, opts) => {
  app.addHook('preHandler', app.authenticate);
  app.addHook('preHandler', requireSection('settings'));

  const service = (req: FastifyRequest) => usersService(req.db, req.auth, opts.sender);

  app.get(
    '/users',
    {
      schema: {
        tags: ['users'],
        security,
        querystring: UserListQuerySchema,
        response: { 200: paginated(UserSchema) },
      },
    },
    (req) => service(req).list(req.query),
  );

  app.post(
    '/users',
    {
      schema: {
        tags: ['users'],
        security,
        body: UserCreateRequestSchema,
        response: { 201: UserSchema },
      },
    },
    async (req, reply) => reply.status(201).send(await service(req).create(req.body)),
  );

  app.patch(
    '/users/:id',
    {
      schema: {
        tags: ['users'],
        security,
        params: IdParams,
        body: UserUpdateRequestSchema,
        response: { 200: UserSchema },
      },
    },
    (req) => service(req).update(req.params.id, req.body),
  );

  app.post(
    '/users/:id/reset-pin',
    { schema: { tags: ['users'], security, params: IdParams, response: { 200: UserSchema } } },
    (req) => service(req).resetPin(req.params.id),
  );

  app.get(
    '/brigades',
    { schema: { tags: ['users'], security, response: { 200: z.array(BrigadeSchema) } } },
    (req) => service(req).listBrigades(),
  );

  app.post(
    '/brigades',
    {
      schema: {
        tags: ['users'],
        security,
        body: BrigadeCreateRequestSchema,
        response: { 201: BrigadeSchema },
      },
    },
    async (req, reply) => reply.status(201).send(await service(req).createBrigade(req.body)),
  );
};
