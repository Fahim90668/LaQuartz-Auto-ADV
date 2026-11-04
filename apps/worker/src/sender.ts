import { DiscordHttpError, sendMessage } from '@app/discord';
import type { DeliveryStatus } from '@app/shared';
import type { Env } from './env.js';

export interface SendResult {
  ok: boolean;
  httpStatus: number;
  discordMessageId: string | null;
  latencyMs: number;
  deliveryStatus: DeliveryStatus;
  errorCode: string | null;
  errorMessage: string | null;
  retryable: boolean;
  retryAfterMs: number | null;
}

export interface SendMessageParams {
  token: string;
  channelId: string;
  content: string;
  env: Env;
}

export async function sendAdvertisement(params: SendMessageParams): Promise<SendResult> {
  const started = Date.now();

  try {
    const res = await sendMessage(
      params.token,
      params.channelId,
      {
        content: params.content,
        allowedMentions: { parse: [] },
      },
      {
        timeoutMs: 15_000,
        superProperties: params.env.DISCORD_SUPER_PROPERTIES,
      },
    );

    const latencyMs = Date.now() - started;

    if (!res.ok || !res.data) {
      return {
        ok: false,
        httpStatus: res.status,
        discordMessageId: null,
        latencyMs,
        deliveryStatus: 'failed',
        errorCode: 'EMPTY_RESPONSE',
        errorMessage: 'Discord returned an empty response.',
        retryable: true,
        retryAfterMs: null,
      };
    }

    return {
      ok: true,
      httpStatus: res.status,
      discordMessageId: res.data.id,
      latencyMs,
      deliveryStatus: 'sent',
      errorCode: null,
      errorMessage: null,
      retryable: false,
      retryAfterMs: null,
    };
  } catch (err) {
    const latencyMs = Date.now() - started;

    if (err instanceof DiscordHttpError) {
      const m = err.mapped;
      return {
        ok: false,
        httpStatus: m.status,
        discordMessageId: null,
        latencyMs,
        deliveryStatus: m.deliveryStatus,
        errorCode: m.errorCode,
        errorMessage: m.message,
        retryable: m.retryable,
        retryAfterMs: m.retryAfterMs,
      };
    }

    return {
      ok: false,
      httpStatus: 0,
      discordMessageId: null,
      latencyMs,
      deliveryStatus: 'failed',
      errorCode: 'UNKNOWN',
      errorMessage: (err as Error).message,
      retryable: true,
      retryAfterMs: null,
    };
  }
}