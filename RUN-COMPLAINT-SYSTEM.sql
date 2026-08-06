-- Clean & Green Sangran - Complaint System
-- Run once in Supabase SQL Editor. Safe to re-run.

create extension if not exists pgcrypto;

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  complaint_no text not null unique,
  name text,
  phone text,
  category text not null,
  description text not null,
  location_text text,
  latitude double precision,
  longitude double precision,
  photo_url text,
  status text not null default 'received' check (status in ('received', 'in_progress', 'resolved')),
  admin_reply text,
  before_photo_url text,
  after_photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index if not exists complaints_status_created_idx
  on public.complaints (status, created_at desc);

alter table public.complaints enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'complaints' and policyname = 'complaints_admin_select'
  ) then
    create policy complaints_admin_select on public.complaints
      for select to authenticated
      using (exists (select 1 from public.admin_users where user_id = auth.uid()));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'complaints' and policyname = 'complaints_admin_update'
  ) then
    create policy complaints_admin_update on public.complaints
      for update to authenticated
      using (exists (select 1 from public.admin_users where user_id = auth.uid()))
      with check (exists (select 1 from public.admin_users where user_id = auth.uid()));
  end if;
end $$;

create or replace function public.set_complaint_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  if new.status = 'resolved' and old.status is distinct from 'resolved' and new.resolved_at is null then
    new.resolved_at := now();
  elsif new.status <> 'resolved' then
    new.resolved_at := null;
  end if;
  return new;
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'complaints_set_updated_at') then
    create trigger complaints_set_updated_at
      before update on public.complaints
      for each row execute function public.set_complaint_updated_at();
  end if;
end $$;

create or replace function public.submit_public_complaint(
  p_name text default '',
  p_phone text default '',
  p_category text default 'other',
  p_description text default '',
  p_location_text text default '',
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_photo_url text default null
)
returns table (complaint_no text, status text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record public.complaints%rowtype;
  v_number text;
begin
  if char_length(trim(coalesce(p_description, ''))) < 10 then
    raise exception 'Complaint description must be at least 10 characters.';
  end if;

  if coalesce(p_category, '') not in ('cleanliness','street-light','water','cemetery','plantation','mosque','roads-drainage','welfare','other') then
    raise exception 'Invalid complaint category.';
  end if;

  v_number := 'CGS-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

  insert into public.complaints (
    complaint_no, name, phone, category, description, location_text,
    latitude, longitude, photo_url
  ) values (
    v_number,
    nullif(left(trim(coalesce(p_name, '')), 100), ''),
    nullif(left(trim(coalesce(p_phone, '')), 30), ''),
    p_category,
    left(trim(p_description), 2000),
    nullif(left(trim(coalesce(p_location_text, '')), 240), ''),
    p_latitude,
    p_longitude,
    nullif(trim(coalesce(p_photo_url, '')), '')
  ) returning * into v_record;

  -- Notification Center support is best-effort so a notification schema change
  -- can never block the complaint itself from being recorded.
  begin
    insert into public.admin_notifications (
      event_type, title, message, source_table, source_id, is_read
    ) values (
      'complaint',
      'New complaint ' || v_record.complaint_no,
      v_record.category || ' • ' || left(v_record.description, 260),
      'complaints',
      v_record.id,
      false
    );
  exception when others then
    null;
  end;

  return query select v_record.complaint_no, v_record.status, v_record.created_at;
end;
$$;

create or replace function public.track_public_complaint(p_complaint_no text)
returns table (
  complaint_no text,
  category text,
  location_text text,
  status text,
  admin_reply text,
  before_photo_url text,
  after_photo_url text,
  created_at timestamptz,
  updated_at timestamptz,
  resolved_at timestamptz
)
language sql
security definer
stable
set search_path = public
as $$
  select
    c.complaint_no,
    c.category,
    c.location_text,
    c.status,
    c.admin_reply,
    c.before_photo_url,
    c.after_photo_url,
    c.created_at,
    c.updated_at,
    c.resolved_at
  from public.complaints c
  where upper(replace(c.complaint_no, ' ', '')) = upper(replace(trim(p_complaint_no), ' ', ''))
  limit 1;
$$;

revoke all on function public.submit_public_complaint(text,text,text,text,text,double precision,double precision,text) from public;
revoke all on function public.track_public_complaint(text) from public;
grant execute on function public.submit_public_complaint(text,text,text,text,text,double precision,double precision,text) to anon, authenticated;
grant execute on function public.track_public_complaint(text) to anon, authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'complaint-media',
  'complaint-media',
  true,
  5242880,
  array['image/jpeg','image/png','image/webp','image/gif']::text[]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'complaint_media_public_upload'
  ) then
    create policy complaint_media_public_upload on storage.objects
      for insert to anon, authenticated
      with check (bucket_id = 'complaint-media');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname = 'complaint_media_admin_update'
  ) then
    create policy complaint_media_admin_update on storage.objects
      for update to authenticated
      using (
        bucket_id = 'complaint-media'
        and exists (select 1 from public.admin_users where user_id = auth.uid())
      )
      with check (
        bucket_id = 'complaint-media'
        and exists (select 1 from public.admin_users where user_id = auth.uid())
      );
  end if;
end $$;

-- Realtime is optional; the admin page also refreshes automatically every 15 seconds.
do $$
begin
  begin
    alter publication supabase_realtime add table public.complaints;
  exception when duplicate_object then
    null;
  end;
end $$;
