import {
  AuthUserSchema,
  CodeVerifyRequestSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  MeUpdateRequestSchema,
  OtpChallengeSchema,
  OtpSendRequestSchema,
  PinLoginRequestSchema,
  RegisterRequestSchema,
  SessionSchema,
} from '@tigu/shared';
import type { FastifyRequest } from 'fastify';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import type { Env } from '../../config/env';
import { notFound } from '../../plugins/errors';
import type { MessageSender } from '../notifications/sender';
import { authService, toAuthUser } from './service';

export interface AuthRoutesOptions {
  env: Env;
  sender: MessageSender;
}

export const authRoutes: FastifyPluginAsyncZod<AuthRoutesOptions> = async (app, opts) => {
  const service = authService({ app, env: opts.env, sender: opts.sender });

  // Spec §13: 5 attempts per 15 minutes per IP + phone for login, PIN and OTP.
  const attemptLimit = {
    rateLimit: {
      max: opts.env.AUTH_RATE_LIMIT_MAX,
      timeWindow: '15 minutes',
      keyGenerator: (req: FastifyRequest) => {
        const body = req.body as { phone?: unknown } | undefined;
        return `${req.ip}:${typeof body?.phone === 'string' ? body.phone : ''}`;
      },
    },
  };

  app.post(
    '/auth/register',
    {
      config: attemptLimit,
      schema: {
        tags: ['auth'],
        body: RegisterRequestSchema,
        response: { 201: OtpChallengeSchema },
      },
    },
    async (req, reply) => reply.status(201).send(await service.register(req.body)),
  );

  app.post(
    '/auth/login',
    {
      config: attemptLimit,
      schema: { tags: ['auth'], body: LoginRequestSchema, response: { 200: LoginResponseSchema } },
    },
    (req, reply) => service.login(req, reply, req.body),
  );

  app.post(
    '/auth/2fa/verify',
    { schema: { tags: ['auth'], body: CodeVerifyRequestSchema, response: { 200: SessionSchema } } },
    (req, reply) => service.verify2fa(req, reply, req.body),
  );

  app.post(
    '/auth/pin',
    {
      config: attemptLimit,
      schema: { tags: ['auth'], body: PinLoginRequestSchema, response: { 200: SessionSchema } },
    },
    (req, reply) => service.pin(req, reply, req.body),
  );

  app.post(
    '/auth/otp/send',
    {
      config: attemptLimit,
      schema: { tags: ['auth'], body: OtpSendRequestSchema, response: { 200: OtpChallengeSchema } },
    },
    (req) => service.sendOtp(req.body),
  );

  app.post(
    '/auth/otp/verify',
    { schema: { tags: ['auth'], body: CodeVerifyRequestSchema, response: { 200: SessionSchema } } },
    (req, reply) => service.verifyOtp(req, reply, req.body),
  );

  app.post(
    '/auth/refresh',
    { schema: { tags: ['auth'], response: { 200: SessionSchema } } },
    (req, reply) => service.refresh(req, reply),
  );

  app.post(
    '/auth/logout',
    { schema: { tags: ['auth'], response: { 204: z.null() } } },
    async (req, reply) => {
      await service.logout(req, reply);
      return reply.status(204).send(null);
    },
  );

  app.get(
    '/auth/me',
    {
      preHandler: app.authenticate,
      schema: { tags: ['auth'], security: [{ bearer: [] }], response: { 200: AuthUserSchema } },
    },
    async (req) => {
      const user = await req.db.user.findFirst({
        where: { id: req.auth.userId },
        include: { tenant: true },
      });
      if (!user) throw notFound('User');
      return toAuthUser(user);
    },
  );

  // The user's own language choice is stored on the account (spec §12).
  app.patch(
    '/auth/me',
    {
      preHandler: app.authenticate,
      schema: {
        tags: ['auth'],
        security: [{ bearer: [] }],
        body: MeUpdateRequestSchema,
        response: { 200: AuthUserSchema },
      },
    },
    async (req) => {
      await req.db.user.update({ where: { id: req.auth.userId }, data: req.body });
      const user = await req.db.user.findFirst({
        where: { id: req.auth.userId },
        include: { tenant: true },
      });
      if (!user) throw notFound('User');
      return toAuthUser(user);
    },
  );
};
