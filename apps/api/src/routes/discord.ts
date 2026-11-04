import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { UUID_PATTERN, SNOWFLAKE_PATTERN } from '@app/shared';
import * as discordService from '../services/discord.service.js';
import { parseQuery } from '../utils/respond.js';

const accountServersQuery = z.object({
  accountId: z.string().regex(UUID_PATTERN),
  refresh: z.enum(['true', 'false']).optional(),
});

const accountChannelsQuery = z.object({
  accountId: z.string().regex(UUID_PATTERN),
  serverId: z.string().regex(SNOWFLAKE_PATTERN),
  refresh: z.enum(['true', 'false']).optional(),
});

const slowmodeQuery = z.object({
  accountId: z.string().regex(UUID_PATTERN),
  channelId: z.string().regex(SNOWFLAKE_PATTERN),
});

const discordRoutes: FastifyPluginAsync = async (app) => {
  app.get('/discord/servers', async (req, reply) => {
    const q = parseQuery(accountServersQuery, req.query);
    const servers = await discordService.listServers(
      req.user!.id,
      q.accountId,
      q.refresh === 'true',
    );
    return reply.code(200).send({ accountId: q.accountId, servers });
  });

  app.get('/discord/channels', async (req, reply) => {
    const q = parseQuery(accountChannelsQuery, req.query);
    const channels = await discordService.listChannels(
      req.user!.id,
      q.accountId,
      q.serverId,
      q.refresh === 'true',
    );
    return reply.code(200).send({
      accountId: q.accountId,
      serverId: q.serverId,
      channels,
    });
  });

  app.get('/discord/slowmode', async (req, reply) => {
    const q = parseQuery(slowmodeQuery, req.query);
    const slowmode = await discordService.readSlowmode(
      req.user!.id,
      q.accountId,
      q.channelId,
    );
    return reply.code(200).send(slowmode);
  });
};

export default discordRoutes;