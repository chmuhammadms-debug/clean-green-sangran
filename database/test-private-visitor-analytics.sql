-- Run against the migration; all fixtures are rolled back.
begin;
set local role anon;
insert into public.site_analytics_events(id,visitor_id,page,source) values
('10000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','home','direct'),
('10000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','project','google');
do $$ begin
  begin perform * from public.site_analytics_events; raise exception 'Anon read unexpectedly allowed';
  exception when insufficient_privilege then null; end;
  begin perform public.site_analytics_summary(); raise exception 'Anon report unexpectedly allowed';
  exception when insufficient_privilege then null; end;
  begin update public.site_analytics_events set page='event'; raise exception 'Anon update unexpectedly allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$ begin
  if exists(select 1 from public.site_analytics_events) then raise exception 'Non-owner can read events'; end if;
  begin perform public.site_analytics_summary(); raise exception 'Non-owner report unexpectedly allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select user_id::text from public.analytics_readers limit 1),true);
set local role authenticated;
do $$ declare r jsonb; begin
  r := public.site_analytics_summary();
  if (r#>>'{periods,today,views}')::int <> 2 then raise exception 'Expected 2 views'; end if;
  if (r#>>'{periods,today,visitors}')::int <> 1 then raise exception 'Expected one unique visitor'; end if;
  if jsonb_array_length(r->'daily') <> 7 then raise exception 'Expected 7 daily buckets'; end if;
  begin delete from public.site_analytics_events; raise exception 'Owner delete unexpectedly allowed';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
rollback;
select 'PASS: anonymous insert, denied public reads and writes, denied non-owner reports, owner totals and visitor deduplication' as result;
