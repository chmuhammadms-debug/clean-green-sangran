create or replace function public.refresh_census_public_summary()
returns trigger language plpgsql set search_path to 'public' as $$
begin
 insert into public.census_public_summary
 (id,households,total_population,adult_men,adult_women,boys,girls,children,senior_citizens,persons_with_disabilities,registered_voters,overseas_residents,mohalla_breakdown,updated_at)
 select 'sangran',count(*)::integer,
 coalesce(sum(adult_men+adult_women+boys+girls),0)::integer,
 coalesce(sum(adult_men),0)::integer,coalesce(sum(adult_women),0)::integer,
 coalesce(sum(boys),0)::integer,coalesce(sum(girls),0)::integer,
 coalesce(sum(boys+girls),0)::integer,coalesce(sum(senior_citizens),0)::integer,
 coalesce(sum(persons_with_disabilities),0)::integer,coalesce(sum(registered_voters),0)::integer,
 coalesce(sum(overseas_residents),0)::integer,'[]'::jsonb,now()
 from public.census_households where is_verified=true
 on conflict(id) do update set households=excluded.households,total_population=excluded.total_population,
 adult_men=excluded.adult_men,adult_women=excluded.adult_women,boys=excluded.boys,girls=excluded.girls,
 children=excluded.children,senior_citizens=excluded.senior_citizens,
 persons_with_disabilities=excluded.persons_with_disabilities,registered_voters=excluded.registered_voters,
 overseas_residents=excluded.overseas_residents,mohalla_breakdown='[]'::jsonb,updated_at=excluded.updated_at;
 return null;
end; $$;
alter table public.census_households alter column is_verified set default false;
update public.census_public_summary set mohalla_breakdown='[]'::jsonb where mohalla_breakdown<>'[]'::jsonb;
