import type { FastifyReply } from 'fastify';
import { ZodError, type ZodSchema } from 'zod';
import { errors } from '@app/shared';

export function ok<T>(reply: FastifyReply, data: T): FastifyReply {
  return reply.code(200).send(data);
}

export function created<T>(reply: FastifyReply, data: T): FastifyReply {
  return reply.code(201).send(data);
}

export function noContent(reply: FastifyReply): FastifyReply {
  return reply.code(204).send();
}

export function parseBody<T>(schema: ZodSchema<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw errors.validation('Invalid request body.', flattenZod(result.error));
  }
  return result.data;
}

export function parseParams<T>(schema: ZodSchema<T>, params: unknown): T {
  const result = schema.safeParse(params);
  if (!result.success) {
    throw errors.validation('Invalid route parameters.', flattenZod(result.error));
  }
  return result.data;
}

export function parseQuery<T>(schema: ZodSchema<T>, query: unknown): T {
  const result = schema.safeParse(query);
  if (!result.success) {
    throw errors.validation('Invalid query parameters.', flattenZod(result.error));
  }
  return result.data;
}

function flattenZod(err: ZodError): unknown {
  return err.flatten();
}