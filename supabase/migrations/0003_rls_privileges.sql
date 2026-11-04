-- ============================================================================
--  0003_rls_privileges — RLS policies + column-level grants
-- ============================================================================

alter table public.profiles            enable row level security;
alter table public.redeem_codes        enable row level security;
alter table public.entitlements        enable row level security;
alter table public.discord_accounts    enable row level security;
alter table public.account_servers     enable row level security;
alter table public.account_channels    enable row level security;
alter table public.playgrounds         enable row level security;
alter table public.playground_channels enable row level security;
alter table public.playground_messages enable row level security;
alter table public.scheduled_jobs      enable row level security;
alter table public.delivery_logs       enable row level security;
alter table public.audit_logs          enable row level security;
alter table public.rate_limit_buckets  enable row level security;
alter table public.worker_heartbeats   enable row level security;
alter table public.app_settings        enable row level security;

-- PROFILES
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ENTITLEMENTS
drop policy if exists entitlements_select_own on public.entitlements;
create policy entitlements_select_own on public.entitlements
  for select using (auth.uid() = user_id or public.is_admin());

-- DISCORD ACCOUNTS
drop policy if exists accounts_select_own on public.discord_accounts;
create policy accounts_select_own on public.discord_accounts
  for select using (auth.uid() = user_id);

drop policy if exists accounts_delete_own on public.discord_accounts;
create policy accounts_delete_own on public.discord_accounts
  for delete using (auth.uid() = user_id);

-- SERVER / CHANNEL CACHE
drop policy if exists servers_select_own on public.account_servers;
create policy servers_select_own on public.account_servers
  for select using (
    exists (select 1 from public.discord_accounts a
             where a.id = account_id and a.user_id = auth.uid())
  );

drop policy if exists channels_select_own on public.account_channels;
create policy channels_select_own on public.account_channels
  for select using (
    exists (select 1 from public.discord_accounts a
             where a.id = account_id and a.user_id = auth.uid())
  );

-- PLAYGROUNDS
drop policy if exists playgrounds_select_own on public.playgrounds;
create policy playgrounds_select_own on public.playgrounds
  for select using (auth.uid() = user_id);

drop policy if exists playgrounds_insert_own on public.playgrounds;
create policy playgrounds_insert_own on public.playgrounds
  for insert with check (auth.uid() = user_id);

drop policy if exists playgrounds_update_own on public.playgrounds;
create policy playgrounds_update_own on public.playgrounds
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists playgrounds_delete_own on public.playgrounds;
create policy playgrounds_delete_own on public.playgrounds
  for delete using (auth.uid() = user_id);

-- PLAYGROUND CHANNELS
drop policy if exists pg_channels_all_own on public.playground_channels;
create policy pg_channels_all_own on public.playground_channels
  for all using (
    exists (select 1 from public.playgrounds g
             where g.id = playground_id and g.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.playgrounds g
             where g.id = playground_id and g.user_id = auth.uid())
  );

-- PLAYGROUND MESSAGES
drop policy if exists pg_messages_all_own on public.playground_messages;
create policy pg_messages_all_own on public.playground_messages
  for all using (
    exists (select 1 from public.playgrounds g
             where g.id = playground_id and g.user_id = auth.uid())
  ) with check (
    exists (select 1 from public.playgrounds g
             where g.id = playground_id and g.user_id = auth.uid())
  );

-- SCHEDULED JOBS (read-only for owners)
drop policy if exists jobs_select_own on public.scheduled_jobs;
create policy jobs_select_own on public.scheduled_jobs
  for select using (
    exists (select 1 from public.playgrounds g
             where g.id = playground_id and g.user_id = auth.uid())
  );

-- DELIVERY LOGS
drop policy if exists logs_select_own on public.delivery_logs;
create policy logs_select_own on public.delivery_logs
  for select using (auth.uid() = user_id or public.is_admin());

-- AUDIT LOGS (admin only)
drop policy if exists audit_select_admin on public.audit_logs;
create policy audit_select_admin on public.audit_logs
  for select using (public.is_admin());

-- PRIVILEGES
grant usage on schema public to anon, authenticated;

revoke all on public.redeem_codes       from anon, authenticated;
revoke all on public.rate_limit_buckets from anon, authenticated;
revoke all on public.worker_heartbeats  from anon, authenticated;
revoke all on public.app_settings       from anon, authenticated;
revoke all on public.audit_logs         from anon, authenticated;

-- Profiles: self-read, limited self-update
revoke update on public.profiles from authenticated;
grant update (username, global_name, avatar_url) on public.profiles to authenticated;

-- Discord accounts: never expose ciphertext
revoke all on public.discord_accounts from authenticated;
grant select (id, user_id, label, discord_user_id, username, global_name, avatar_url,
              status, last_validated_at, last_error, last_error_at, created_at, updated_at)
  on public.discord_accounts to authenticated;
grant delete on public.discord_accounts to authenticated;

-- Owner-scoped tables
grant select, insert, update, delete on public.playgrounds         to authenticated;
grant select, insert, update, delete on public.playground_channels to authenticated;
grant select, insert, update, delete on public.playground_messages to authenticated;
grant select on public.scheduled_jobs to authenticated;
grant select on public.delivery_logs  to authenticated;
grant select on public.entitlements   to authenticated;
grant select on public.account_servers, public.account_channels to authenticated;

-- RPC access
grant execute on function public.redeem_code(text)      to authenticated;
grant execute on function public.get_my_access()        to authenticated;
grant execute on function public.fn_has_access(uuid)    to authenticated;
grant execute on function public.fn_effective_playground_limit(uuid) to authenticated;

revoke execute on function public.bot_create_code(text, text, public.code_duration, smallint, text, text) from anon, authenticated;
revoke execute on function public.bot_destroy_code(text, text) from anon, authenticated;
revoke execute on function public.claim_due_jobs(integer, text)  from anon, authenticated;
revoke execute on function public.complete_job(uuid, integer, text, integer, timestamptz) from anon, authenticated;
revoke execute on function public.fail_job(uuid, text, boolean, public.delivery_status, integer) from anon, authenticated;
revoke execute on function public.rehydrate_runtime()   from anon, authenticated;
revoke execute on function public.recover_stale_jobs()  from anon, authenticated;
revoke execute on function public.expire_entitlements() from anon, authenticated;