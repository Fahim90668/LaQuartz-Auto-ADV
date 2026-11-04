# Architecture

## Components

| App | Tech | Job |
|-----|------|-----|
| `web` | Next.js 15 | UI only. Never touches tokens. |
| `api` | Fastify 5 | Auth, encryption, business logic, Discord REST proxy |
| `bot` | discord.js v14 | `/create-code`, `/destroy-code` (admin only) |
| `worker` | Node daemon | Polls `scheduled_jobs`, sends messages |
| `db` | Supabase | Single source of truth (Postgres + RLS + RPC + pg_cron) |

Every app is stateless. All state lives in Supabase. Wipe anything → reconnect → it rebuilds.

## Who talks to what

- **web → api**: HTTPS, Supabase JWT in `Authorization`
- **web → supabase**: Realtime subscriptions + read-only RLS queries
- **api → supabase**: `service_role` for token reads/writes, user JWT for RLS-checked ops
- **bot → supabase**: `service_role` (bot is trusted)
- **worker → supabase**: `service_role` + RPC (`claim_due_jobs`, `complete_job`, `fail_job`)
- **worker → Discord API**: `POST /channels/{id}/messages` with decrypted user token

## Data flow — the only one you need to know
