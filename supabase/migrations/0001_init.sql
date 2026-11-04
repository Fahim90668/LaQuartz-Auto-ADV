-- ============================================================================
--  0001_init — extensions, enums, helpers, tables, indexes, triggers, views
-- ============================================================================

-- 0. EXTENSIONS
create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "pg_cron";
create extension if not exists "pg_net";

-- 1. ENUMS
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('user', 'admin');
  end if;
  if not exists (select 1 from pg_type where typname = 'code_duration') then
    create type public.code_duration as enum ('lifetime', '1m', '3m');
  end if;
  if not exists (select 1 from pg_type where typname = 'code_status') then
    create type public.code_status as enum ('active', 'redeemed', 'destroyed', 'expired');
  end if;
  if not exists (select 1 from pg_type where typname = 'entitlement_status') then
    create type public.entitlement_status as enum ('active', 'expired', 'revoked');
  end if;
  if not exists (select 1 from pg_type where typname = 'account_status') then
    create type public.account_status as enum ('active', 'invalid', 'checking', 'removed');
  end if;
  if not exists (select 1 from pg_type where typname = 'playground_mode') then
    create type public.playground_mode as enum ('manual', 'slowmode');
  end if;
  if not exists (select 1 from pg_type where typname = 'playground_status') then
    create type public.playground_status as enum ('idle', 'running', 'paused', 'error');
  end if;
  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type public.job_status as enum ('pending', 'running', 'sent', 'failed', 'cancelled', 'skipped');
  end if;
  if not exists (select 1 from pg_type where typname = 'delivery_status') then
    create type public.delivery_status as enum ('sent', 'failed', 'rate_limited', 'invalid_token', 'no_permission', 'skipped');
  end if;
  if not exists (select 1 from pg_type where typname = 'actor_type') then
    create type public.actor_type as enum ('user', 'admin', 'system', 'bot', 'worker');
  end if;
end $$;

-- 2. HELPERS
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
     where p.id = auth.uid() and p.role = 'admin' and p.is_banned = false
  );
$$;

-- 3. TABLES

create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  discord_id     text not null unique,
  username       text not null,
  global_name    text,
  discriminator  text,
  email          citext,
  avatar_url     text,
  role           public.user_role not null default 'user',
  is_banned      boolean not null default false,
  ban_reason     text,
  last_login_at  timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint profiles_discord_id_format check (discord_id ~ '^[0-9]{17,20}$'),
  constraint profiles_username_len check (char_length(username) between 1 and 64)
);

create table if not exists public.redeem_codes (
  id                     uuid primary key default gen_random_uuid(),
  code_hash              text not null unique,
  code_preview           text not null,
  duration               public.code_duration not null,
  duration_days          integer,
  playground_limit       smallint not null check (playground_limit between 1 and 50),
  status                 public.code_status not null default 'active',
  batch_id               uuid,
  note                   text,
  created_by             uuid references public.profiles(id) on delete set null,
  created_by_discord_id  text,
  redeemed_by            uuid references public.profiles(id) on delete set null,
  redeemed_at            timestamptz,
  expires_at             timestamptz,
  destroyed_at           timestamptz,
  destroyed_by_discord_id text,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  constraint redeem_codes_duration_consistency check (
    (duration = 'lifetime' and duration_days is null) or
    (duration in ('1m','3m') and duration_days is not null and duration_days > 0)
  ),
  constraint redeem_codes_redeemed_state check (
    (status = 'redeemed' and redeemed_by is not null and redeemed_at is not null) or
    (status <> 'redeemed')
  )
);

create table if not exists public.entitlements (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  code_id           uuid not null unique references public.redeem_codes(id) on delete restrict,
  playground_limit  smallint not null check (playground_limit > 0),
  status            public.entitlement_status not null default 'active',
  starts_at         timestamptz not null default now(),
  expires_at        timestamptz,
  revoked_at        timestamptz,
  revoke_reason     text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint entitlements_revoked_state check (
    (status = 'revoked' and revoked_at is not null) or (status <> 'revoked')
  )
);

create table if not exists public.discord_accounts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.profiles(id) on delete cascade,
  label              text not null,
  discord_user_id    text,
  username           text,
  global_name        text,
  avatar_url         text,
  token_ciphertext   bytea not null,
  token_iv           bytea not null,
  token_tag          bytea not null,
  key_version        smallint not null default 1,
  token_fingerprint  text not null,
  status             public.account_status not null default 'active',
  last_validated_at  timestamptz,
  last_error         text,
  last_error_at      timestamptz,
  removed_at         timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint discord_accounts_label_len check (char_length(label) between 1 and 64),
  constraint discord_accounts_fingerprint_unique unique (user_id, token_fingerprint),
  constraint discord_accounts_owner_fk unique (id, user_id)
);

create table if not exists public.account_servers (
  id             uuid primary key default gen_random_uuid(),
  account_id     uuid not null references public.discord_accounts(id) on delete cascade,
  server_id      text not null,
  server_name    text,
  icon_hash      text,
  owner          boolean not null default false,
  permissions    text,
  member_count   integer,
  fetched_at     timestamptz not null default now(),
  unique (account_id, server_id)
);

create table if not exists public.account_channels (
  id               uuid primary key default gen_random_uuid(),
  account_id       uuid not null references public.discord_accounts(id) on delete cascade,
  server_id        text not null,
  channel_id       text not null,
  channel_name     text,
  channel_type     smallint not null default 0,
  position         integer not null default 0,
  slowmode_seconds integer not null default 0,
  can_send         boolean not null default true,
  fetched_at       timestamptz not null default now(),
  unique (account_id, channel_id)
);

create table if not exists public.playgrounds (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  account_id        uuid not null,
  name              text not null,
  mode              public.playground_mode not null default 'manual',
  interval_seconds  integer not null default 300
                      check (interval_seconds between 30 and 604800),
  status            public.playground_status not null default 'idle',
  last_sent_at      timestamptz,
  next_run_at       timestamptz,
  last_error        text,
  last_error_at     timestamptz,
  total_sent        integer not null default 0,
  total_failed      integer not null default 0,
  started_at        timestamptz,
  stopped_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint playgrounds_name_len check (char_length(name) between 1 and 80),
  constraint playgrounds_account_owner_fk
    foreign key (account_id, user_id)
    references public.discord_accounts(id, user_id) on delete cascade,
  constraint playgrounds_owner_id_unique unique (id, user_id)
);

create table if not exists public.playground_channels (
  id                uuid primary key default gen_random_uuid(),
  playground_id     uuid not null references public.playgrounds(id) on delete cascade,
  server_id         text not null,
  server_name       text,
  channel_id        text not null,
  channel_name      text,
  slowmode_seconds  integer not null default 0 check (slowmode_seconds >= 0),
  is_active         boolean not null default true,
  position          smallint not null default 0,
  last_sent_at      timestamptz,
  next_run_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint playground_channels_ids_format check (
    server_id  ~ '^[0-9]{17,20}$' and channel_id ~ '^[0-9]{17,20}$'
  ),
  constraint playground_channels_unique unique (playground_id, channel_id)
);

create table if not exists public.playground_messages (
  id            uuid primary key default gen_random_uuid(),
  playground_id uuid not null references public.playgrounds(id) on delete cascade,
  content       text not null check (char_length(content) between 1 and 4000),
  position      smallint not null default 0,
  is_active     boolean not null default true,
  times_used    integer not null default 0,
  last_used_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint playground_messages_unique_position unique (playground_id, position)
);

create table if not exists public.scheduled_jobs (
  id                    uuid primary key default gen_random_uuid(),
  playground_id         uuid not null references public.playgrounds(id) on delete cascade,
  playground_channel_id uuid not null references public.playground_channels(id) on delete cascade,
  message_id            uuid references public.playground_messages(id) on delete set null,
  run_at                timestamptz not null,
  status                public.job_status not null default 'pending',
  attempts              smallint not null default 0,
  max_attempts          smallint not null default 5,
  idempotency_key       text not null unique,
  locked_at             timestamptz,
  locked_by             text,
  lease_expires_at      timestamptz,
  last_error            text,
  finished_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint scheduled_jobs_attempts_range check (attempts between 0 and max_attempts)
);

create table if not exists public.delivery_logs (
  id                 bigserial primary key,
  user_id            uuid references public.profiles(id) on delete cascade,
  playground_id      uuid references public.playgrounds(id) on delete cascade,
  job_id             uuid references public.scheduled_jobs(id) on delete set null,
  account_id         uuid references public.discord_accounts(id) on delete set null,
  channel_id         text not null,
  status             public.delivery_status not null,
  http_status        integer,
  discord_message_id text,
  error_code         text,
  error_message      text,
  latency_ms         integer,
  attempt            smallint,
  created_at         timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id           bigserial primary key,
  actor_type   public.actor_type not null,
  actor_id     text,
  action       text not null,
  target_type  text,
  target_id    text,
  metadata     jsonb not null default '{}'::jsonb,
  ip           inet,
  user_agent   text,
  created_at   timestamptz not null default now()
);

create table if not exists public.rate_limit_buckets (
  key         text primary key,
  tokens      numeric not null,
  capacity    numeric not null,
  refill_rate numeric not null,
  updated_at  timestamptz not null default now()
);

create table if not exists public.worker_heartbeats (
  worker_id       text primary key,
  role            text not null default 'advertiser',
  version         text,
  started_at      timestamptz not null default now(),
  last_seen_at    timestamptz not null default now(),
  jobs_processed  integer not null default 0,
  jobs_failed     integer not null default 0,
  metadata        jsonb not null default '{}'::jsonb
);

create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

-- 4. INDEXES
create index if not exists profiles_role_admin_idx        on public.profiles (id) where role = 'admin';
create index if not exists profiles_discord_id_idx        on public.profiles (discord_id);

create index if not exists redeem_codes_status_idx        on public.redeem_codes (status);
create index if not exists redeem_codes_redeemed_by_idx   on public.redeem_codes (redeemed_by);
create index if not exists redeem_codes_batch_idx         on public.redeem_codes (batch_id);
create index if not exists redeem_codes_expires_idx       on public.redeem_codes (expires_at)
  where status = 'redeemed' and expires_at is not null;

create index if not exists entitlements_user_active_idx   on public.entitlements (user_id) where status = 'active';
create index if not exists entitlements_expiry_idx        on public.entitlements (expires_at)
  where status = 'active' and expires_at is not null;

create index if not exists discord_accounts_user_idx      on public.discord_accounts (user_id);
create index if not exists discord_accounts_status_idx    on public.discord_accounts (status) where status <> 'removed';

create index if not exists account_servers_account_idx    on public.account_servers (account_id);
create index if not exists account_channels_lookup_idx    on public.account_channels (account_id, server_id);

create index if not exists playgrounds_user_idx           on public.playgrounds (user_id);
create index if not exists playgrounds_status_idx         on public.playgrounds (status) where status in ('running','error');
create index if not exists playgrounds_account_idx        on public.playgrounds (account_id);

create index if not exists playground_channels_pg_idx     on public.playground_channels (playground_id);
create index if not exists playground_messages_pg_idx     on public.playground_messages (playground_id, position);

create index if not exists scheduled_jobs_due_idx         on public.scheduled_jobs (run_at)
  where status = 'pending';
create index if not exists scheduled_jobs_running_idx     on public.scheduled_jobs (lease_expires_at)
  where status = 'running';
create index if not exists scheduled_jobs_playground_idx  on public.scheduled_jobs (playground_id, status);

create index if not exists delivery_logs_playground_idx   on public.delivery_logs (playground_id, created_at desc);
create index if not exists delivery_logs_user_idx         on public.delivery_logs (user_id, created_at desc);
create index if not exists delivery_logs_job_idx          on public.delivery_logs (job_id);

create index if not exists audit_logs_created_idx         on public.audit_logs (created_at desc);
create index if not exists audit_logs_actor_idx           on public.audit_logs (actor_id, created_at desc);
create index if not exists audit_logs_action_idx          on public.audit_logs (action, created_at desc);

-- 5. UPDATED_AT TRIGGERS
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','redeem_codes','entitlements','discord_accounts','playgrounds',
    'playground_channels','playground_messages','scheduled_jobs'
  ] loop
    execute format(
      'drop trigger if exists trg_%1$s_updated_at on public.%1$s;
       create trigger trg_%1$s_updated_at before update on public.%1$s
       for each row execute function public.tg_set_updated_at();', t);
  end loop;
end $$;

-- 6. BUSINESS-RULE HELPERS
create or replace function public.fn_effective_playground_limit(p_user uuid)
returns integer language sql stable security definer set search_path = public as $$
  select coalesce(sum(playground_limit), 0)::int
    from public.entitlements
   where user_id = p_user
     and status  = 'active'
     and (expires_at is null or expires_at > now());
$$;

create or replace function public.fn_has_access(p_user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.entitlements
     where user_id = p_user and status = 'active'
       and (expires_at is null or expires_at > now())
  );
$$;

create or replace function public.tg_enforce_playground_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_limit int := public.fn_effective_playground_limit(new.user_id);
  v_count int;
begin
  if v_limit = 0 then
    raise exception 'NO_ENTITLEMENT' using errcode = 'P0001',
      hint = 'User has no active entitlement.';
  end if;
  select count(*) into v_count from public.playgrounds where user_id = new.user_id;
  if v_count >= v_limit then
    raise exception 'PLAYGROUND_LIMIT_REACHED'
      using errcode = 'P0001',
            hint  = format('Limit is %s playground(s) for this account.', v_limit);
  end if;
  return new;
end $$;

create or replace function public.tg_enforce_channel_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  select count(*) into v_count
    from public.playground_channels where playground_id = new.playground_id;
  if v_count >= 5 then
    raise exception 'CHANNEL_LIMIT_REACHED'
      using errcode = 'P0001', hint = 'Maximum 5 channels per playground.';
  end if;
  return new;
end $$;

create or replace function public.tg_handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, discord_id, username, global_name, email, avatar_url, last_login_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'provider_id', new.raw_user_meta_data->>'sub'),
    coalesce(new.raw_user_meta_data->>'user_name', new.raw_user_meta_data->>'full_name', 'user'),
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'avatar_url',
    now()
  )
  on conflict (id) do update
    set username      = excluded.username,
        global_name   = excluded.global_name,
        email         = excluded.email,
        avatar_url    = excluded.avatar_url,
        last_login_at = now();
  return new;
end $$;

-- 7. TRIGGERS
drop trigger if exists trg_playgrounds_limit on public.playgrounds;
create trigger trg_playgrounds_limit
before insert on public.playgrounds
for each row execute function public.tg_enforce_playground_limit();

drop trigger if exists trg_playground_channels_limit on public.playground_channels;
create trigger trg_playground_channels_limit
before insert on public.playground_channels
for each row execute function public.tg_enforce_channel_limit();

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
after insert or upd