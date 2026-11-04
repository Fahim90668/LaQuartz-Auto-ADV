-- ============================================================================
--  0004_cron_seed — pg_cron maintenance + app_settings defaults
-- ============================================================================

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobname)
      from cron.job
     where jobname in ('expire_entitlements','recover_stale_jobs','prune_delivery_logs');

    perform cron.schedule('expire_entitlements', '* * * * *',
      $$select public.expire_entitlements();$$);
    perform cron.schedule('recover_stale_jobs',  '* * * * *',
      $$select public.recover_stale_jobs();$$);
    perform cron.schedule('prune_delivery_logs', '0 4 * * *',
      $$delete from public.delivery_logs where created_at < now() - interval '60 days';$$);
  end if;
end $$;

insert into public.app_settings (key, value) values
  ('token_key_version',              '1'::jsonb),
  ('max_channels_per_playground',    '5'::jsonb),
  ('max_messages_per_playground',    '10'::jsonb),
  ('worker_lease_seconds',           '120'::jsonb),
  ('advertisement_worker_enabled',   'true'::jsonb)
on conflict (key) do nothing;