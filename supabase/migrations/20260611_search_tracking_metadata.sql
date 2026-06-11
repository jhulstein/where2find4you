alter table public.searches
  add column if not exists normalized_query text not null default '',
  add column if not exists result_count integer not null default 0,
  add column if not exists filters_used jsonb not null default '{}'::jsonb,
  add column if not exists user_location_available boolean not null default false,
  add column if not exists latency_ms integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'searches_result_count_non_negative'
  ) then
    alter table public.searches
      add constraint searches_result_count_non_negative
        check (result_count >= 0) not valid;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'searches_latency_ms_non_negative'
  ) then
    alter table public.searches
      add constraint searches_latency_ms_non_negative
        check (latency_ms is null or latency_ms >= 0) not valid;
  end if;
end $$;

alter table public.place_clicks
  add column if not exists result_position integer;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'place_clicks_result_position_positive'
  ) then
    alter table public.place_clicks
      add constraint place_clicks_result_position_positive
        check (result_position is null or result_position > 0) not valid;
  end if;
end $$;

create index if not exists searches_normalized_query_idx
  on public.searches (normalized_query);

create index if not exists searches_created_at_idx
  on public.searches (created_at desc);

create index if not exists searches_filters_used_idx
  on public.searches using gin (filters_used);
