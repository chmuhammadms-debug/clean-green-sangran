-- Private, first-party aggregate website analytics.
create table public.analytics_readers (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.analytics_readers enable row level security;
revoke all on public.analytics_readers from public, anon, authenticated;
grant select on public.analytics_readers to authenticated;
create policy analytics_reader_self on public.analytics_readers for select to authenticated
  using (user_id = (select auth.uid()));
insert into public.analytics_readers(user_id)
select u.id from auth.users u join public.admin_users a on a.user_id=u.id
where lower(u.email)='chmuhammadms@gmail.com';

create table public.site_analytics_events (
  id uuid primary key,
  visitor_id uuid not null,
  created_at timestamptz not null default now(),
  page text not null check (page in ('home','project','event','records','membership','donation')),
  source text not null check (source in ('direct','google','facebook','instagram','other'))
);
create index site_analytics_events_created_at_idx on public.site_analytics_events(created_at);
alter table public.site_analytics_events enable row level security;
revoke all on public.site_analytics_events from public, anon, authenticated;
grant insert (id, visitor_id, page, source) on public.site_analytics_events to anon, authenticated;
grant select on public.site_analytics_events to authenticated;
create policy analytics_receive_event on public.site_analytics_events for insert to anon, authenticated
  with check (created_at = now());
create policy analytics_owner_read on public.site_analytics_events for select to authenticated
  using (exists (select 1 from public.analytics_readers r where r.user_id=(select auth.uid())));

create function public.site_analytics_summary() returns jsonb
language plpgsql stable security invoker set search_path = '' as $$
declare result jsonb;
begin
  if not exists(select 1 from public.analytics_readers where user_id=auth.uid()) then
    raise exception 'Analytics access denied' using errcode='42501';
  end if;
  with clock as (
    select (now() at time zone 'Asia/Karachi')::date as today
  ), periods as (
    select 'today' as label, today as start_day from clock
    union all select 'week', today-6 from clock
    union all select 'month', date_trunc('month',today)::date from clock
  ), recent as (
    select visitor_id,page,source,(created_at at time zone 'Asia/Karachi')::date as day
    from public.site_analytics_events
    where created_at >= (((select today from clock)-31)::timestamp at time zone 'Asia/Karachi')
  ), summary as (
    select p.label,count(r.visitor_id) as views,count(distinct r.visitor_id) as visitors
    from periods p left join recent r on r.day>=p.start_day group by p.label
  ), days as (
    select today-i as day from clock cross join generate_series(0,6) i
  ), daily as (
    select d.day,count(r.visitor_id) as views,count(distinct r.visitor_id) as visitors
    from days d left join recent r on r.day=d.day group by d.day
  ), pages as (
    select page,count(*) as views from recent where day >= (select start_day from periods where label='month') group by page
  ), sources as (
    select source,count(*) as views from recent where day >= (select start_day from periods where label='month') group by source
  )
  select jsonb_build_object(
    'periods',(select jsonb_object_agg(label,jsonb_build_object('views',views,'visitors',visitors)) from summary),
    'daily',(select jsonb_agg(to_jsonb(d) order by d.day) from daily d),
    'pages',coalesce((select jsonb_agg(to_jsonb(p) order by views desc) from pages p),'[]'::jsonb),
    'sources',coalesce((select jsonb_agg(to_jsonb(s) order by views desc) from sources s),'[]'::jsonb),
    'updated_at',now()
  ) into result;
  return result;
end $$;
revoke all on function public.site_analytics_summary() from public, anon;
grant execute on function public.site_analytics_summary() to authenticated;
