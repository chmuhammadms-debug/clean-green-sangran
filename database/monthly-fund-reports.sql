create table public.monthly_fund_reports (
  report_date date primary key,
  image_url text,
  image_name text,
  constraint monthly_fund_reports_image_pair
    check ((image_url is null) = (image_name is null))
);

alter table public.monthly_fund_reports enable row level security;

revoke all on public.monthly_fund_reports from anon, authenticated;
grant select on public.monthly_fund_reports to anon, authenticated;
grant insert, update on public.monthly_fund_reports to authenticated;

create policy "Anyone can see monthly report changes"
  on public.monthly_fund_reports for select using (true);

create policy "Admins can add monthly reports"
  on public.monthly_fund_reports for insert to authenticated
  with check (public.is_admin());

create policy "Admins can change monthly reports"
  on public.monthly_fund_reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Only admins can upload monthly report images"
  on storage.objects as restrictive for insert to public
  with check (
    bucket_id <> 'website-media'
    or (storage.foldername(name))[1] is distinct from 'monthly-fund-reports'
    or public.is_admin()
  );

create policy "Only admins can update monthly report images"
  on storage.objects as restrictive for update to public
  using (
    bucket_id <> 'website-media'
    or (storage.foldername(name))[1] is distinct from 'monthly-fund-reports'
    or public.is_admin()
  )
  with check (
    bucket_id <> 'website-media'
    or (storage.foldername(name))[1] is distinct from 'monthly-fund-reports'
    or public.is_admin()
  );

create policy "Only admins can delete monthly report images"
  on storage.objects as restrictive for delete to public
  using (
    bucket_id <> 'website-media'
    or (storage.foldername(name))[1] is distinct from 'monthly-fund-reports'
    or public.is_admin()
  );
