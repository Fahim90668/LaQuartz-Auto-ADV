import fp from 'fastify-plugin';
import { jwtVerify, type JWTPayload } from 'jose';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { errors } from '@app/shared';
import type { Env } from '../env.js';

export interface AuthUser {
  id: string;
  email: string | null;
  role: string;
}

interface SupabaseJwtPayload extends JWTPayload {
  sub: string;
  email?: string;
  role?: string;
  aud?: string;
  app_metadata?: { role?: string };
}

export interface AuthPluginOptions {
  env: Env;
}

const PUBLIC_ROUTES = new Set(['/health']);

function extractBearer(header: string | undefined): string | null {
  if (!header) return null;
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match ? match[1]!.trim() : null;
}

async function verifyJwt(token: string, secret: string): Promise<AuthUser> {
  const key = new TextEncoder().encode(secret);
  let payload: SupabaseJwtPayload;
  try {
    const result = await jwtVerify(token, key, {
      algorithms: ['HS256'],
      audience: 'authenticated',
    });
    payload = result.payload as SupabaseJwtPayload;
  } catch (err) {
    throw errors.notAuthenticated();
  }

  if (!payload.sub) {
    throw errors.notAuthenticated();
  }

  return {
    id: payload.sub,
    email: payload.email ?? null,
    role: payload.role ?? 'user',
  };
}

export default fp<AuthPluginOptions>(
  async function authPlugin(app: FastifyInstance, opts: AuthPluginOptions) {
    app.decorateRequest('user', null);

    app.addHook('onRequest', async (req: FastifyRequest, _reply: FastifyReply) => {
      const path = req.url.split('?')[0] ?? req.url;
      if (PUBLIC_ROUTES.has(path)) return;

      const token = extractBearer(req.headers.authorization);
      if (!token) {
        throw errors.notAuthenticated();
      }

      req.user = await verifyJwt(token, opts.env.SUPABASE_JWT_SECRET);
    });

    app.decorate('requireAccess', async (req: FastifyRequest, _reply: FastifyReply) => {
      if (!req.user) throw errors.notAuthenticated();
      const { getServiceClient } = await import('@app/db');
      const { data, error } = await getServiceClient().rpc('fn_has_access', {
        p_user: req.user.id,
      });
      if (error) throw error;
      if (!data) throw errors.noAccess();
    });
  },
  { name: 'auth' },
);

declare module 'fastify' {
  interface FastifyRequest {
    user: AuthUser | null;
  }
  interface FastifyInstance {
    requireAccess: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}