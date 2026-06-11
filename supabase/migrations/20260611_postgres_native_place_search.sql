create schema if not exists extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists postgis with schema extensions;

set search_path = public, extensions;

create or replace function public.normalize_search_query(query text)
returns text
language sql
immutable
parallel safe
as $$
  select trim(
    regexp_replace(
      regexp_replace(
        lower(coalesce(query, '')),
        'wi[[:space:]-]?fi',
        'wifi',
        'g'
      ),
      '[[:space:]]+',
      ' ',
      'g'
    )
  );
$$;

create or replace function public.places_search_text(
  place_name text,
  place_category text,
  place_tags text[],
  place_short_description text,
  place_description text
)
returns text
language sql
immutable
parallel safe
as $$
  select public.normalize_search_query(
    concat_ws(
      ' ',
      place_name,
      place_category,
      array_to_string(coalesce(place_tags, array[]::text[]), ' '),
      place_short_description,
      place_description
    )
  );
$$;

alter table public.places
  add column if not exists geog geography(Point, 4326)
  generated always as (
    case
      when latitude is null or longitude is null then null
      else st_setsrid(st_makepoint(longitude, latitude), 4326)::geography
    end
  ) stored;

create index if not exists places_name_trgm_idx
  on public.places using gin (public.normalize_search_query(name) gin_trgm_ops);

create index if not exists places_category_trgm_idx
  on public.places using gin (public.normalize_search_query(category) gin_trgm_ops);

create index if not exists places_tags_trgm_idx
  on public.places using gin (public.normalize_search_query(array_to_string(tags, ' ')) gin_trgm_ops);

create index if not exists places_description_trgm_idx
  on public.places using gin (
    public.normalize_search_query(concat_ws(' ', short_description, description)) gin_trgm_ops
  );

create index if not exists places_search_text_trgm_idx
  on public.places using gin (
    public.places_search_text(name, category, tags, short_description, description) gin_trgm_ops
  );

create index if not exists places_geog_gist_idx
  on public.places using gist (geog)
  where geog is not null;

create index if not exists places_active_category_city_idx
  on public.places (is_active, category, city);

create or replace function public.search_places(
  search_query text default '',
  filter_category text default null,
  search_lat double precision default null,
  search_lon double precision default null,
  search_radius_meters integer default null,
  result_limit integer default 25,
  result_offset integer default 0
)
returns table (
  id text,
  name text,
  slug text,
  category text,
  description text,
  short_description text,
  address text,
  city text,
  country text,
  latitude double precision,
  longitude double precision,
  website_url text,
  phone text,
  email text,
  image_url text,
  source text,
  source_id text,
  tags text[],
  is_sponsored boolean,
  sponsored_priority integer,
  is_active boolean,
  rating numeric,
  opening_hours text,
  created_at timestamptz,
  updated_at timestamptz,
  distance_meters double precision,
  text_score double precision,
  distance_score double precision,
  match_tier integer,
  popularity_score bigint,
  verified_score integer,
  freshness_score double precision,
  relevance_score double precision,
  total_count bigint
)
language sql
stable
set search_path = public, extensions
as $$
  with params as (
    select
      public.normalize_search_query(search_query) as q,
      nullif(public.normalize_search_query(filter_category), '') as category_filter,
      case
        when search_lat is null or search_lon is null then null::geography
        else st_setsrid(st_makepoint(search_lon, search_lat), 4326)::geography
      end as origin,
      greatest(1, least(coalesce(result_limit, 25), 100)) as page_limit,
      greatest(0, coalesce(result_offset, 0)) as page_offset
  ),
  popularity as (
    select
      place_id,
      count(*)::bigint as impressions
    from public.place_impressions
    group by place_id
  ),
  scored as (
    select
      p.*,
      coalesce(popularity.impressions, 0)::bigint as popularity_score,
      0::integer as verified_score,
      extract(epoch from p.updated_at)::double precision as freshness_score,
      case
        when params.origin is null or p.geog is null then null::double precision
        else st_distance(p.geog, params.origin)
      end as distance_meters,
      public.normalize_search_query(p.name) as normalized_name,
      public.normalize_search_query(p.category) as normalized_category,
      public.normalize_search_query(array_to_string(p.tags, ' ')) as normalized_tags,
      public.normalize_search_query(concat_ws(' ', p.short_description, p.description)) as normalized_description,
      public.places_search_text(p.name, p.category, p.tags, p.short_description, p.description) as normalized_all,
      params.q,
      params.category_filter,
      params.origin
    from public.places p
    left join popularity on popularity.place_id = p.id
    cross join params
    where p.is_active
      and (
        params.category_filter is null
        or params.category_filter = 'all'
        or p.category = params.category_filter
        or (
          params.category_filter = 'free-wifi'
          and public.places_search_text(p.name, p.category, p.tags, p.short_description, p.description) like '%wifi%'
        )
        or (
          params.category_filter = 'rooftops'
          and public.places_search_text(p.name, p.category, p.tags, p.short_description, p.description) like '%rooftop%'
        )
      )
      and (
        search_radius_meters is null
        or params.origin is null
        or p.geog is null
        or st_dwithin(p.geog, params.origin, search_radius_meters)
      )
  ),
  ranked as (
    select
      scored.*,
      case
        when q = '' then 0
        when normalized_name = q then 70
        when normalized_name like q || '%' then 60
        when normalized_name like '%' || q || '%'
          or not exists (
            select 1
            from unnest(string_to_array(q, ' ')) as query_terms(query_term)
            where not (
              normalized_name like '%' || query_term || '%'
              or similarity(normalized_name, query_term) >= 0.18
              or word_similarity(query_term, normalized_name) >= 0.18
            )
          )
          then 50
        when normalized_category like '%' || q || '%'
          or normalized_tags like '%' || q || '%'
          or similarity(normalized_category, q) >= 0.18
          or similarity(normalized_tags, q) >= 0.18
          or word_similarity(q, normalized_category) >= 0.18
          or word_similarity(q, normalized_tags) >= 0.18
          then 40
        when normalized_description like '%' || q || '%'
          or similarity(normalized_description, q) >= 0.12
          or word_similarity(q, normalized_description) >= 0.16
          then 30
        else 0
      end as match_tier,
      case
        when q = '' then 0
        else
          case when normalized_name = q then 12000 else 0 end +
          case when normalized_name like q || '%' then 8500 else 0 end +
          case when normalized_name like '%' || q || '%' then 6200 else 0 end +
          greatest(
            similarity(normalized_name, q),
            word_similarity(q, normalized_name)
          ) * 900 +
          greatest(
            similarity(normalized_category, q),
            similarity(normalized_tags, q),
            word_similarity(q, normalized_category),
            word_similarity(q, normalized_tags)
          ) * 650 +
          greatest(
            similarity(normalized_description, q),
            word_similarity(q, normalized_description)
          ) * 220 +
          case when normalized_all like '%' || q || '%' then 120 else 0 end
      end as text_score,
      case
        when distance_meters is null then 0
        else greatest(0, 360 - (distance_meters / 100.0))
      end as distance_score
    from scored
    where q = ''
      or normalized_all like '%' || q || '%'
      or similarity(normalized_name, q) >= 0.18
      or word_similarity(q, normalized_name) >= 0.18
      or similarity(normalized_category, q) >= 0.18
      or similarity(normalized_tags, q) >= 0.18
      or word_similarity(q, normalized_tags) >= 0.18
      or similarity(normalized_description, q) >= 0.12
      or word_similarity(q, normalized_description) >= 0.16
  ),
  final as (
    select
      ranked.*,
      text_score +
        distance_score +
        least(popularity_score, 100)::double precision * 0.1 +
        verified_score::double precision * 25 +
        coalesce(rating, 0)::double precision * 8 +
        least(coalesce(sponsored_priority, 0), 3) as relevance_score,
      count(*) over () as total_count
    from ranked
  )
  select
    final.id,
    final.name,
    final.slug,
    final.category,
    final.description,
    final.short_description,
    final.address,
    final.city,
    final.country,
    final.latitude,
    final.longitude,
    final.website_url,
    final.phone,
    final.email,
    final.image_url,
    final.source,
    final.source_id,
    final.tags,
    final.is_sponsored,
    final.sponsored_priority,
    final.is_active,
    final.rating,
    final.opening_hours,
    final.created_at,
    final.updated_at,
    final.distance_meters,
    final.text_score,
    final.distance_score,
    final.match_tier,
    final.popularity_score,
    final.verified_score,
    final.freshness_score,
    final.relevance_score,
    final.total_count
  from final
  cross join params
  order by
    case when q = '' then 0 else match_tier end desc,
    distance_score desc,
    distance_meters asc nulls last,
    case when q = '' then 0 else text_score end desc,
    popularity_score desc,
    verified_score desc,
    freshness_score desc,
    relevance_score desc,
    sponsored_priority desc,
    name asc
  limit (select page_limit from params)
  offset (select page_offset from params);
$$;
