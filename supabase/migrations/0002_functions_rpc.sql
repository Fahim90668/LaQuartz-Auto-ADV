-- ============================================================================
--  0002_functions_rpc — business RPCs (redeem, bot, worker queue)
-- ============================================================================

-- USER: redeem
create or replace function public.redeem_code(p_code_hash text)
returns table (success boolean, message text, entitlement_id uuid,
               expires_at timestamptz, playground_limit integer)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid      uuid := auth.uid();
  v_code     public.redeem_codes%rowtype;
  v_ent      public.entitlements%rowtype;
  v_expires  timestamptz;
begin
  if v_uid is null then
    return query select false, 'Not authenticated', null::uuid, null::timestamptz, null::int;
    return;
  end if;

  select * into v_code from public.redeem_codes
   where code_hash = p_code_hash for update;

  if not found then
    return query select false, 'Invalid code.', null::uuid, null::timestamptz, null::int; return;
  end if;
  if v_code.status = 'destroyed' then
    return query select false, 'This code has been revoked.', null::uuid, null::timestamptz, null::int; return;
  end if;
  if v_code.status = 'redeemed' then
    return query select false, 'This code has already been redeemed.', null::uuid, null::timestamptz, null::int; return;
  end if;
  if v_code.status = 'expired' then
    return query select false, 'This code has expired.', null::uuid, null::timestamptz, null::int; return;
  end if;

  if v_code.duration = 'lifetime' then
    v_expires := null;
  else
    v_expires := now() + make_interval(days => v_code.duration_days);
  end if;

  insert into public.entitlements (user_id, code_id, playground_limit, status, starts_at, expires_at)
  values (v_uid, v_code.id, v_code.playground_limit, 'active', now(), v_expires)
  returning * into v_ent;

  update public.redeem_codes
     set status = 'redeemed', redeemed_by = v_uid, redeemed_at = now(), expires_at = v_expires
   where id = v_code.id;

  insert into public.audit_logs (actor_type, actor_id, action, target_type, target_id, metadata)
  values ('user', v_uid::text, 'code.redeem', 'redeem_code', v_code.id::text,
          jsonb_build_object('duration', v_code.duration, 'playground_limit', v_code.playground_limit));

  return query select true, 'Code redeemed successfully.', v_ent.id, v_expires, v_code.playground_limit;
end $$;

-- USER: access snapshot
create or replace function public.get_my_access()
returns table (has_access boolean, effective_playground_limit integer,
               playgrounds_used integer, soonest_expiry timestamptz,
               is_lifetime boolean, is_banned boolean)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  return query
  select
    public.fn_has_access(v_uid),
    public.fn_effective_playground_limit(v_uid),
    (select count(*)::int from public.playgrounds where user_id = v_uid),
    (select min(e.expires_at) from public.entitlements e
      where e.user_id = v_uid and e.status = 'active' and e.expires_at is not null),
    not exists (select 1 from public.entitlements e
                 where e.user_id = v_uid and e.status = 'active' and e.expires_at is not null),
    (select is_banned from public.profiles where id = v_uid);
end $$;

-- BOT: create code
create or replace function public.bot_create_code(
  p_code_hash        text,
  p_code_preview     text,
  p_duration         public.code_duration,
  p_playground_limit smallint,
  p_admin_discord_id text,
  p_note             text default null
) returns table (code_id uuid, created_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare v_days integer; v_admin uuid;
begin
  if p_playground_limit < 1 or p_playground_limit > 50 then
    raise exception 'INVALID_PLAYGROUND_LIMIT';
  end if;

  v_days := case p_duration when '1m' then 30 when '3m' then 90 else null end;
  select id into v_admin from public.profiles where discord_id = p_admin_discord_id;

  return query
  insert into public.redeem_codes
    (code_hash, code_preview, duration, duration_days, playground_limit,
     created_by, created_by_discord_id, note)
  values
    (p_code_hash, p_code_preview, p_duration, v_days, p_playground_limit,
     v_admin, p_admin_discord_id, p_note)
  returning id, created_at;

  insert into public.audit_logs (actor_type, actor_id, action, target_type, target_id, metadata)
  values ('admin', p_admin_discord_id, 'code.create', 'redeem_code', p_code_preview,
          jsonb_build_object('duration', p_duration, 'playground_limit', p_playground_limit));
end $$;

-- BOT: destroy code
create or replace function public.bot_destroy_code(
  p_code_hash        text,
  p_admin_discord_id text
) returns table (found boolean, affected_entitlements integer, stopped_playgrounds integer)
language plpgsql security definer set search_path = public as $$
declare v_code public.redeem_codes%rowtype; v_ents int := 0; v_pgs int := 0; v_user uuid;
begin
  select * into v_code from public.redeem_codes where code_hash = p_code_hash for update;
  if not found then
    return query select false, 0, 0; return;
  end if;

  update public.redeem_codes
     set status = 'destroyed', destroyed_at = now(), destroyed_by_discord_id = p_admin_discord_id
   where id = v_code.id;

  select user_id into v_user from public.entitlements where code_id = v_code.id;

  with revoked as (
    update public.entitlements
       set status = 'revoked', revoked_at = now(), revoke_reason = 'code_destroyed'
     where code_id = v_code.id and status <> 'revoked'
    returning user_id
  ) select count(*) into v_ents from revoked;

  if v_user is not null and not public.fn_has_access(v_user) then
    with stopped as (
      update public.playgrounds
         set status = 'paused', stopped_at = now(), next_run_at = null
       where user_id = v_user and status in ('running','idle')
      returning id
    ) select count(*) into v_pgs from stopped;

    update public.scheduled_jobs j
       set status = 'cancelled', finished_at = now(), updated_at = now()
      from public.playgrounds p
     where j.playground_id = p.id and p.user_id = v_user and j.status = 'pending';
  end if;

  insert into public.audit_logs (actor_type, actor_id, action, target_type, target_id, metadata)
  values ('admin', p_admin_discord_id, 'code.destroy', 'redeem_code', v_code.code_preview,
          jsonb_build_object('affected_entitlements', v_ents, 'stopped_playgrounds', v_pgs));

  return query select true, v_ents, v_pgs;
end $$;

-- SYSTEM: expire stale entitlements (cron)
create or replace function public.expire_entitlements()
returns integer language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  with expired as (
    update public.entitlements
       set status = 'expired'
     where status = 'active' and expires_at is not null and expires_at <= now()
    returning user_id
  ) select count(*) into v_count from expired;

  if v_count > 0 then
    update public.playgrounds p
       set status = 'paused', next_run_at = null, stopped_at = now()
     where p.status in ('running','idle')
       and not public.fn_has_access(p.user_id);

    update public.scheduled_jobs j
       set status = 'cancelled', finished_at = now()
      from public.playgrounds p
     where j.playground_id = p.id and j.status = 'pending'
       and not public.fn_has_access(p.user_id);

    insert into public.audit_logs (actor_type, action, metadata)
    values ('system', 'entitlements.expire', jsonb_build_object('count', v_count));
  end if;

  return v_count;
end $$;

-- WORKER: recover stale leases
create or replace function public.recover_stale_jobs()
returns integer language plpgsql security definer set search_path = public as $$
declare v_count int;
begin
  with recovered as (
    update public.scheduled_jobs
       set status = case when attempts >= max_attempts then 'failed'::public.job_status
                         else 'pending'::public.job_status end,
           run_at         = case when attempts >= max_attempts then run_at
                                 else now() + make_interval(secs => least(300, power(2, attempts) * 5)) end,
           locked_at      = null,
           locked_by      = null,
           lease_expires_at = null,
           finished_at    = case when attempts >= max_attempts then now() else null end,
           last_error     = coalesce(last_error, 'lease_expired'),
           updated_at     = now()
     where status = 'running' and lease_expires_at < now()
    returning id
  ) select count(*) into v_count from recovered;
  return v_count;
end $$;

-- WORKER: claim due jobs atomically
create or replace function public.claim_due_jobs(
  p_limit  integer default 25,
  p_worker text    default 'worker'
) returns setof public.scheduled_jobs
language sql security definer set search_path = public as $$
  with due as (
    select j.id
      from public.scheduled_jobs j
      join public.playgrounds p on p.id = j.playground_id
     where j.status = 'pending'
       and j.run_at <= now()
       and p.status = 'running'
     order by j.run_at
     for update of j skip locked
     limit p_limit
  )
  update public.scheduled_jobs j
     set status           = 'running',
         attempts         = j.attempts + 1,
         locked_at        = now(),
         locked_by        = p_worker,
         lease_expires_at = now() + interval '2 minutes',
         updated_at       = now()
    from due
   where j.id = due.id
  returning j.*;
$$;

-- WORKER: complete a job
create or replace function public.complete_job(
  p_job_id            uuid,
  p_http_status       integer,
  p_discord_message_id text,
  p_latency_ms        integer,
  p_next_run_at       timestamptz
) returns void
language plpgsql security definer set search_path = public as $$
declare v_job public.scheduled_jobs%rowtype;
begin
  update public.scheduled_jobs
     set status = 'sent', finished_at = now(), updated_at = now(),
         lease_expires_at = null, last_error = null
   where id = p_job_id
  returning * into v_job;

  if not found then return; end if;

  update public.playground_channels
     set last_sent_at = now(), next_run_at = p_next_run_at, updated_at = now()
   where id = v_job.playground_channel_id;

  update public.playgrounds p
     set last_sent_at = now(),
         next_run_at  = (select min(next_run_at) from public.playground_channels
                          where playground_id = p.id and is_active),
         total_sent   = total_sent + 1,
         last_error   = null,
         updated_at   = now()
   where id = v_job.playground_id;

  insert into public.delivery_logs
    (user_id, playground_id, job_id, account_id, channel_id, status,
     http_status, discord_message_id, latency_ms, attempt)
  select p.user_id, p.id, v_job.id, p.account_id,
         (select channel_id from public.playground_channels where id = v_job.playground_channel_id),
         'sent', p_http_status, p_discord_message_id, p_latency_ms, v_job.attempts
    from public.playgrounds p where p.id = v_job.playground_id;
end $$;

-- WORKER: fail a job with backoff
create or replace function public.fail_job(
  p_job_id      uuid,
  p_error       text,
  p_retryable   boolean,
  p_delivery    public.delivery_status default 'failed',
  p_http_status integer default null
) returns void
language plpgsql security definer set search_path = public as $$
declare v_job public.scheduled_jobs%rowtype; v_backoff int;
begin
  select * into v_job from public.scheduled_jobs where id = p_job_id for update;
  if not found then return; end if;

  v_backoff := least(300, (power(2, v_job.attempts) * 5)::int);

  if p_retryable and v_job.attempts < v_job.max_attempts then
    update public.scheduled_jobs
       set status = 'pending',
           run_at = now() + make_interval(secs => v_backoff + floor(random() * 5)::int),
           last_error = p_error, locked_at = null, locked_by = null,
           lease_expires_at = null, updated_at = now()
     where id = p_job_id;
  else
    update public.scheduled_jobs
       set status = 'failed', last_error = p_error, finished_at = now(),
           lease_expires_at = null, updated_at = now()
     where id = p_job_id;

    update public.playgrounds
       set total_failed = total_failed + 1, last_error = p_error,
           last_error_at = now(), updated_at = now()
     where id = v_job.playground_id;
  end if;

  insert into public.delivery_logs
    (user_id, playground_id, job_id, account_id, channel_id, status,
     http_status, error_message, attempt)
  select p.user_id, p.id, v_job.id, p.account_id,
         (select channel_id from public.playground_channels where id = v_job.playground_channel_id),
         p_delivery, p_http_status, p_error, v_job.attempts
    from public.playgrounds p where p.id = v_job.playground_id;
end $$;

-- WORKER: rehydrate runtime on boot
create or replace function public.rehydrate_runtime()
returns table (recovered_jobs integer, rescheduled_playgrounds integer)
language plpgsql security definer set search_path = public as $$
declare v_jobs int; v_pgs int;
begin
  v_jobs := public.recover_stale_jobs();

  with seeded as (
    insert into public.scheduled_jobs
      (playground_id, playground_channel_id, message_id, run_at, idempotency_key)
    select p.id, pc.id,
           (select m.id from public.playground_messages m
             where m.playground_id = p.id and m.is_active
             order by m.position limit 1),
           now() + make_interval(secs => case p.mode
                                          when 'slowmode' then greatest(pc.slowmode_seconds, 5)
                                          else p.interval_seconds end),
           format('%s:%s:%s', p.id, pc.id, extract(epoch from now())::bigint)
      from public.playgrounds p
      join public.playground_channels pc on pc.playground_id = p.id and pc.is_active
     where p.status = 'running'
       and not exists (
         select 1 from public.scheduled_jobs j
          where j.playground_id = p.id and j.status in ('pending','running')
       )
    on conflict (idempotency_key) do nothing
    returning 1
  ) select count(*) into v_pgs from seeded;

  insert into public.audit_logs (actor_type, action, metadata)
  values ('system', 'runtime.rehydrate',
          jsonb_build_object('recovered_jobs', v_jobs, 'seeded_jobs', v_pgs));

  return query select v_jobs, v_pgs;
end $$;