create extension if not exists "pgcrypto";

create table if not exists public.places (
  id text primary key,
  name text not null,
  slug text not null unique,
  category text not null,
  description text not null,
  short_description text not null,
  address text,
  city text,
  country text,
  latitude double precision,
  longitude double precision,
  website_url text,
  phone text,
  email text,
  image_url text,
  source text not null default 'manual',
  source_id text,
  tags text[] not null default '{}',
  is_sponsored boolean not null default false,
  sponsored_priority integer not null default 0,
  is_active boolean not null default true,
  rating numeric,
  opening_hours text not null default 'Hours not provided',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.searches (
  id text primary key,
  query text not null,
  normalized_query text not null default '',
  detected_category text,
  detected_location text,
  result_count integer not null default 0,
  filters_used jsonb not null default '{}'::jsonb,
  user_location_available boolean not null default false,
  latency_ms integer,
  user_city text,
  user_country text,
  session_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.place_impressions (
  id text primary key,
  place_id text not null references public.places(id) on delete cascade,
  search_id text references public.searches(id) on delete set null,
  session_id text not null,
  result_position integer not null,
  is_sponsored boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.place_clicks (
  id text primary key,
  place_id text not null references public.places(id) on delete cascade,
  search_id text references public.searches(id) on delete set null,
  session_id text not null,
  click_type text not null check (
    click_type in ('profile', 'website', 'map', 'phone', 'booking', 'claim', 'promote')
  ),
  result_position integer,
  created_at timestamptz not null default now()
);

create table if not exists public.place_views (
  id text primary key,
  place_id text not null references public.places(id) on delete cascade,
  search_id text references public.searches(id) on delete set null,
  session_id text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.import_batches (
  id text primary key default gen_random_uuid()::text,
  source text not null,
  area_name text not null,
  latitude double precision not null,
  longitude double precision not null,
  radius_meters integer not null,
  categories text[] not null default '{}',
  requested_limit integer not null,
  imported_count integer not null default 0,
  skipped_duplicates integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.business_leads (
  id text primary key default gen_random_uuid()::text,
  place_id text not null references public.places(id) on delete cascade,
  lead_status text not null default 'new',
  notes text,
  last_contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists places_slug_idx on public.places (slug);
create index if not exists places_category_idx on public.places (category);
create index if not exists places_city_country_idx on public.places (city, country);
create index if not exists places_sponsored_idx on public.places (is_sponsored, sponsored_priority desc);
create index if not exists places_tags_idx on public.places using gin (tags);
create index if not exists searches_query_idx on public.searches using gin (to_tsvector('english', query));
create index if not exists searches_normalized_query_idx on public.searches (normalized_query);
create index if not exists searches_created_at_idx on public.searches (created_at desc);
create index if not exists searches_filters_used_idx on public.searches using gin (filters_used);
create index if not exists place_impressions_place_id_idx on public.place_impressions (place_id);
create index if not exists place_impressions_search_id_idx on public.place_impressions (search_id);
create index if not exists place_clicks_place_id_idx on public.place_clicks (place_id);
create index if not exists place_clicks_search_id_idx on public.place_clicks (search_id);
create index if not exists place_views_place_id_idx on public.place_views (place_id);
create index if not exists import_batches_created_at_idx on public.import_batches (created_at desc);

-- Recommended before production:
-- 1. Enable row-level security.
-- 2. Allow public read access only for active places.
-- 3. Restrict admin writes to authenticated admin users or service-role routes.
-- 4. Store only anonymous session IDs for tracking unless accounts are added later.
