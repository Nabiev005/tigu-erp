import { LeadRequestSchema, maskPhone } from '@tigu/shared';
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { systemDb } from '../../lib/db';

/** Demo requests from the public site (spec §9, 6.1). Telegram notification arrives in stage 9. */
export const leadsRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/leads',
    {
      config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
      schema: {
        tags: ['public'],
        body: LeadRequestSchema,
        response: { 201: z.object({ id: z.string() }) },
      },
    },
    async (req, reply) => {
      const lead = await systemDb().lead.create({ data: req.body });
      req.log.info({ leadId: lead.id, phone: maskPhone(lead.phone) }, 'new lead');
      return reply.status(201).send({ id: lead.id });
    },
  );
};
