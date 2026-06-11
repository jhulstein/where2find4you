import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationPath = new URL(
  "../supabase/migrations/20260611_postgres_native_place_search.sql",
  import.meta.url,
);
const sql = await readFile(migrationPath, "utf8");

test("enables PostgreSQL-native fuzzy and geography extensions", () => {
  assert.match(sql, /create extension if not exists pg_trgm/i);
  assert.match(sql, /create extension if not exists postgis/i);
  assert.match(sql, /create extension if not exists unaccent/i);
  assert.match(sql, /geography\(Point,\s*4326\)/i);
});

test("normalizes accents, possessives, plurals and WiFi variants in SQL", () => {
  assert.match(sql, /unaccent\(coalesce\(query, ''\)\)/i);
  assert.match(sql, /\[’‘\]/i);
  assert.match(sql, /\(\[\[:alnum:\]\]\+\)''s/i);
  assert.match(sql, /wi\[\[:space:\]-\]\*fi\+/i);
  assert.match(sql, /\\mcafes\\M/i);
});

test("adds trigram and geography indexes for place search", () => {
  assert.match(sql, /using gin .*name.*gin_trgm_ops/is);
  assert.match(sql, /using gin .*tags.*gin_trgm_ops/is);
  assert.match(sql, /using gin .*description.*gin_trgm_ops/is);
  assert.match(sql, /using gist \(geog\)/i);
});

test("search function uses pg_trgm typo tolerance and distance ranking", () => {
  assert.match(sql, /create or replace function public\.search_places/i);
  assert.match(sql, /similarity\(/i);
  assert.match(sql, /word_similarity\(/i);
  assert.match(sql, /st_distance\(/i);
  assert.match(sql, /st_dwithin\(/i);
});

test("combined score keeps text relevance ahead of distance and sponsorship", () => {
  assert.match(sql, /normalized_name = q then 120/i);
  assert.match(sql, /normalized_category = q then 110/i);
  assert.match(sql, /normalized_tags like '%' \|\| q \|\| '%' then 85/i);
  assert.match(sql, /normalized_name like q \|\| '%' then 80/i);
  assert.match(sql, /then 70/i);
  assert.match(sql, /then 55/i);
  assert.match(sql, /then 30/i);
  assert.match(sql, /distance_score \+/i);
  assert.match(sql, /least\(popularity_score, 100\)::double precision \* 0\.02/i);
  assert.match(sql, /least\(coalesce\(sponsored_priority, 0\), 2\)/i);
  assert.match(sql, /order by\s+case when q = '' then 0 else match_tier end desc/is);
  assert.match(sql, /case when q = '' then 0 else text_score end desc/i);
  assert.match(sql, /popularity_score desc/i);
  assert.match(sql, /verified_score desc/i);
  assert.match(sql, /freshness_score desc/i);
});

test("pagination is preserved through limit and offset parameters", () => {
  assert.match(sql, /result_limit integer default 25/i);
  assert.match(sql, /result_offset integer default 0/i);
  assert.match(sql, /limit \(select page_limit from params\)/i);
  assert.match(sql, /offset \(select page_offset from params\)/i);
});
