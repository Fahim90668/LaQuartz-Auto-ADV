import type { FastifyPluginAsync } from 'fastify';
import { getServiceClient } from '@app/db';

const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get('/health', async (_req, reply) => {
    const started = Date.now();
    let dbOk = true;
    try {
      const { error } = await getServiceClient()
        .from('app_settings')
        .select('key')
        .limit(1);
      if (error) dbOk = false;
    } catch {
      dbOk = false;
    }

    const status = dbOk ? 'ok' : 'degraded';
    const httpStatus = dbOk ? 200 : 503;

    return reply.code(httpStatus).send({
      status,
      db: dbOk ? 'up' : 'down',
      uptimeSeconds: Math.floor(process.uptime()),
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
    });
  });
};

export default healthRoutes;