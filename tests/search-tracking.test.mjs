import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationSql = await readFile(
  new URL("../supabase/migrations/20260611_search_tracking_metadata.sql", import.meta.url),
  "utf8",
);
const searchPageSource = await readFile(new URL("../app/search/page.tsx", import.meta.url), "utf8");
const placeCardSource = await readFile(new URL("../components/PlaceCard.tsx", import.meta.url), "utf8");
const trackingLinkSource = await readFile(new URL("../components/TrackingLink.tsx", import.meta.url), "utf8");

test("search tracking migration stores quality and performance metadata", () => {
  assert.match(migrationSql, /normalized_query text not null default ''/i);
  assert.match(migrationSql, /result_count integer not null default 0/i);
  assert.match(migrationSql, /filters_used jsonb not null default '\{\}'::jsonb/i);
  assert.match(migrationSql, /user_location_available boolean not null default false/i);
  assert.match(migrationSql, /latency_ms integer/i);
  assert.match(migrationSql, /searches_filters_used_idx/i);
});

test("click tracking can capture the clicked result and rank", () => {
  assert.match(migrationSql, /alter table public\.place_clicks/i);
  assert.match(migrationSql, /add column if not exists result_position integer/i);
  assert.match(searchPageSource, /searchId=\{searchRecord\.id\}/);
  assert.match(searchPageSource, /resultPosition=\{index \+ 1\}/);
  assert.match(placeCardSource, /resultPosition=\{resultPosition\}/);
  assert.match(trackingLinkSource, /trackPlaceClick\(\{ placeId, clickType, resultPosition, searchId \}\)/);
});
