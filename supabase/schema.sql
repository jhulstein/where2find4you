create extension if not exists "pgcrypto";

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  country text not null,
  latitude double precision not null,
  longitude double precision not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  city_id uuid not null references public.cities(id) on delete cascade,
  name text not null,
  category text not null,
  address text not null,
  latitude double precision not null,
  longitude double precision not null,
  website text,
  rating numeric(2, 1),
  price_level integer,
  opening_hours text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.place_scores (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places(id) on delete cascade,
  wifi_score integer not null check (wifi_score between 0 and 100),
  work_score integer not null check (work_score between 0 and 100),
  quiet_score integer not null check (quiet_score between 0 and 100),
  rooftop_score integer check (rooftop_score between 0 and 100),
  view_score integer check (view_score between 0 and 100),
  confidence_score integer not null check (confidence_score between 0 and 100),
  total_score integer not null check (total_score between 0 and 100),
  summary text not null,
  pros text[] not null default '{}',
  cons text[] not null default '{}',
  source_notes text[] not null default '{}',
  checked_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_name text not null,
  city text not null,
  status text not null check (status in ('queued', 'running', 'completed', 'failed')),
  places_found integer not null default 0,
  places_updated integer not null default 0,
  error_message text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists cities_slug_idx on public.cities (slug);
create index if not exists places_city_id_idx on public.places (city_id);
create index if not exists places_tags_idx on public.places using gin (tags);
create index if not exists place_scores_place_id_idx on public.place_scores (place_id);
create index if not exists place_scores_total_score_idx on public.place_scores (total_score desc);
create index if not exists agent_runs_started_at_idx on public.agent_runs (started_at desc);

-- TODO: Add row-level security policies before connecting production users.
-- TODO: Add scheduled verification metadata once real agent jobs are enabled.
