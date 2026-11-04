import type { FastifyPluginAsync } from 'fastify';
import {
  createPlaygroundSchema,
  updatePlaygroundSchema,
  playgroundIdParamSchema,
  playgroundChannelParamSchema,
  channelInputSchema,
  messageInputSchema,
} from '@app/shared';
import * as playgroundService from '../services/playground.service.js';
import { recordAudit } from '../services/audit.service.js';
import { parseBody, parseParams } from '../utils/respond.js';
import { rateLimitConfig } from '../plugins/rate-limit.js';

const playgroundRoutes: FastifyPluginAsync = async (app) => {
  app.get('/playgrounds', async (req, reply) => {
    const items = await playgroundService.listPlaygrounds(req.user!.id);
    return reply.code(200).send({ items });
  });

  app.post(
    '/playgrounds',
    rateLimitConfig(10, '1 minute'),
    async (req, reply) => {
      const input = parseBody(createPlaygroundSchema, req.body);
      const pg = await playgroundService.createPlayground(req.user!.id, input);

      await recordAudit({
        actorType: 'user',
        actorId: req.user!.id,
        action: 'playground.create',
        targetType: 'playground',
        targetId: pg.id,
        metadata: { mode: pg.mode, channels: pg.channels.length },
        ip: req.ip,
        userAgent: req.headers['user-agent'] ?? null,
      });

      return reply.code(201).send(pg);
    },
  );

  app.get('/playgrounds/:id', async (req, reply) => {
    const { id } = parseParams(playgroundIdParamSchema, req.params);
    const pg = await playgroundService.getPlayground(req.user!.id, id);
    return reply.code(200).send(pg);
  });

  app.patch('/playgrounds/:id', async (req, reply) => {
    const { id } = parseParams(playgroundIdParamSchema, req.params);
    const input = parseBody(updatePlaygroundSchema, req.body);
    const pg = await playgroundService.updatePlayground(req.user!.id, id, input);
    return reply.code(200).send(pg);
  });

  app.delete('/playgrounds/:id', async (req, reply) => {
    const { id } = parseParams(playgroundIdParamSchema, req.params);
    await playgroundService.deletePlayground(req.user!.id, id);

    await recordAudit({
      actorType: 'user',
      actorId: req.user!.id,
      action: 'playground.delete',
      targetType: 'playground',
      targetId: id,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return reply.code(204).send();
  });

  app.post('/playgrounds/:id/start', async (req, reply) => {
    const { id } = parseParams(playgroundIdParamSchema, req.params);
    const pg = await playgroundService.startPlayground(req.user!.id, id);

    await recordAudit({
      actorType: 'user',
      actorId: req.user!.id,
      action: 'playground.start',
      targetType: 'playground',
      targetId: id,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return reply.code(200).send({
      status: pg.status,
      nextRunAt: pg.nextRunAt,
      seededJobs: pg.channels.filter((c) => c.isActive).length,
    });
  });

  app.post('/playgrounds/:id/stop', async (req, reply) => {
    const { id } = parseParams(playgroundIdParamSchema, req.params);
    const pg = await playgroundService.stopPlayground(req.user!.id, id);

    await recordAudit({
      actorType: 'user',
      actorId: req.user!.id,
      action: 'playground.stop',
      targetType: 'playground',
      targetId: id,
      ip: req.ip,
      userAgent: req.headers['user-agent'] ?? null,
    });

    return reply.code(200).send({ status: pg.status });
  });

  app.post(
    '/playgrounds/:id/channels',
    rateLimitConfig(20, '1 minute'),
    async (req, reply) => {
      const { id } = parseParams(playgroundIdParamSchema, req.params);
      const input = parseBody(channelInputSchema, req.body);
      const channel = await playgroundService.addChannel(req.user!.id, id, input);
      return reply.code(201).send(channel);
    },
  );

  app.delete('/playgrounds/:id/channels/:channelId', async (req, reply) => {
    const { id, channelId } = parseParams(playgroundChannelParamSchema, req.params);
    await playgroundService.removeChannel(req.user!.id, id, channelId);
    return reply.code(204).send();
  });

  app.post(
    '/playgrounds/:id/messages',
    rateLimitConfig(20, '1 minute'),
    async (req, reply) => {
      const { id } = parseParams(playgroundIdParamSchema, req.params);
      const input = parseBody(messageInputSchema, req.body);
      const msg = await playgroundService.addMessage(req.user!.id, id, input.content);
      return reply.code(201).send(msg);
    },
  );
};

export default playgroundRoutes;