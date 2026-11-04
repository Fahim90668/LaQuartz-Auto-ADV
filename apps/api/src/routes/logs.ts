import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { UUID_PATTERN, errors } from '@app/shared';
import { playgrounds as playgroundsDb, logs as logsDb } from '@app/db';
import { parseParams, parseQuery } from '../utils/respond.js';

const playgroundIdParams = z.object({
  id: z.string().regex(UUID_PATTERN),
});

const logsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  before: z.coerce.number().int().positive().optional(),
});

const logRoutes: FastifyPluginAsync = async (app) => {
  app.get('/playgrounds/:id/logs', async (req, reply) => {
    const { id } = parseParams(playgroundIdParams, req.params);
    const q = parseQuery(logsQuery, req.query);

    const pg = await playgroundsDb.getPlaygroundById(id, req.user!.id);
    if (!pg) throw errors.playgroundNotFound();

    const page = await logsDb.listDeliveryLogsForPlayground(id, q.limit, q.before);
    return reply.code(200).send({
      logs: page.items,
      nextCursor: page.nextCursor,
    });
  });

  app.get('/logs', async (req, reply) => {
    const items = await logsDb.listDeliveryLogsForUser(req.user!.id, 100);
    return reply.code(200).send({ items });
  });
};

export default logRoutes;