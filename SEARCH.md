# Search v2

Search is centralized in `lib/search/searchService.ts`.

## Current Flow

1. The UI submits `/search` through `components/SearchBar.tsx`.
2. `app/search/page.tsx` calls `searchPlaces(...)`.
3. `app/api/search/route.ts` also calls `searchPlaces(...)`.
4. `searchPlaces(...)` normalizes the query, detects intent, gathers candidates from Supabase or static seed data, optionally supplements sparse local results with OpenStreetMap, and calls the shared ranking core.
5. `lib/search/ranking.js` owns query normalization, intent/synonym expansion, filtering, ranking, and pagination through `searchPlaceRecords(...)`.
6. Search records, impressions, and clicks are tracked in `lib/tracking.ts`.

Legacy `lib/ai/recommendPlaces.ts` now uses the Search v2 intent detector instead of keeping its own category keyword map.

## Searchable Data

Places currently support:

- `name`
- `category`
- `tags`
- optional `amenities`
- optional `features`
- `description`
- `shortDescription`
- `address`
- `city`
- `country`
- `latitude`
- `longitude`
- `rating`
- `openingHours`
- optional `isVerified`
- optional `hasWifi`
- optional `freeWifi`

The Supabase `places` table currently stores name, category, tags, descriptions, address, latitude/longitude, rating, opening hours, sponsorship, active status, and timestamps. Optional structured fields such as `amenities`, `features`, `hasWifi`, `freeWifi`, and `isVerified` are supported in the application ranker and can be added to the database later.

## Database Indexes

Base schema indexes:

- `places_slug_idx`
- `places_category_idx`
- `places_city_country_idx`
- `places_sponsored_idx`
- `places_tags_idx`
- tracking indexes on searches, impressions, clicks, and views

Search migration:

- enables `pg_trgm`
- enables `postgis`
- enables `unaccent`
- adds generated `geog geography(Point, 4326)`
- adds trigram indexes for name, category, tags, description, and combined search text
- adds GiST geography index
- adds `search_places(...)` RPC with limit/offset pagination

## Normalization

`normalizeQuery(...)` handles:

- lowercase
- trim
- duplicate spaces
- smart apostrophes: `’` and `‘`
- possessives: `cafe’s`, `cafe's` -> `cafe`
- accents: `café` -> `cafe`
- focused plural handling: `cafes` -> `cafe`
- punctuation
- WiFi variants: `wifi`, `Wi-Fi`, `wi fi`, `wifii`

## Intents And Synonyms

Defined in `searchIntents` in `lib/search/ranking.js`.

Cafe intent:

- `cafe`
- `cafes`
- `café`
- `cafés`
- `cafe's`
- `cafe’s`
- `coffee`
- `coffee shop`
- `coffeehouse`
- `espresso bar`
- `kafé`
- `kaffebar`
- `kaffe`

WiFi intent:

- `wifi`
- `wi-fi`
- `wi fi`
- `wireless internet`
- `internet access`
- `hotspot`
- `wlan`

Free WiFi intent:

- `free wifi`
- `free wi-fi`
- `complimentary wifi`
- `public wifi`
- `free internet`
- `no-cost internet`
- `included wifi`

## Ranking

Ranking is tier-first. The current model is:

1. Exact normalized name match: `+120`
2. Exact structured category/type match: `+110`
3. Exact structured amenity match: `+100`
4. Structured `freeWifi`/free-WiFi match: `+100`
5. Tag match: `+85`
6. Name prefix match: `+80`
7. Category or amenity synonym match: `+70`
8. Fuzzy name/category/tag match: `+55`
9. Description match: `+30`
10. Free/complimentary modifier: `+20`
11. Nearby distance boost: `+0` to `+20`
12. Verified/open/rating/popularity/sponsorship tie-breakers: `+0` to `+10`

Location boosts only apply after relevance tiers, so nearby irrelevant places should not outrank relevant text or structured matches.

## Filters And Pagination

Filters are normalized through `normalizeSearchFilter(...)` and applied by the shared core:

- `all`
- `free-wifi`
- `rooftops`
- place categories such as `cafes`, `restaurants`, `hotels`

Pagination is handled by `searchPlaceRecords(...)` with `limit` and `offset`. The API also accepts `limit` and `offset`.

## Why The Old Search Returned Too Few Results

- Query normalization did not fully handle possessives like `cafe’s`.
- Cafe synonyms such as `coffee shop`, `coffeehouse`, `kafé`, `kaffebar`, and `kaffe` were not centralized.
- WiFi variants such as `wireless internet`, `wlan`, and misspelled `wifii` were not treated as one intent.
- Search logic was duplicated across the page, API route, recommendation helper, filter helper, and database helper.
- Category filters could accidentally become ranking matches and make weak results appear relevant.
- Supabase and local/static fallback behavior were decided in route code rather than a single backend service.

## Adding A New Intent

1. Add the intent to `searchIntents` in `lib/search/ranking.js`.
2. Add phrase variants and normalized terms.
3. If it maps to a category, set `category`.
4. If it needs special structured matching, extend `placeMatchesIntent(...)`.
5. Add regression cases in `tests/search-v2.test.mjs`.
6. If Supabase should support it natively, update `search_places(...)` and its migration tests.

## Known Regression Queries

- `cafe`
- `cafes`
- `café`
- `cafés`
- `cafe's`
- `cafe’s`
- `coffee`
- `coffee shop`
- `coffeehouse`
- `espresso bar`
- `kafé`
- `kaffebar`
- `free WiFi`
- `wifi`
- `wi-fi`
- `wireless internet`
- `wlan`
- `free wifii`
- `included wifi`

## Running Search Tests

Run the focused search tests:

```bash
node --test tests/search-v2.test.mjs tests/search-ranking.test.mjs tests/search-relevance-suite.test.mjs tests/supabase-search-migration.test.mjs
```

Run all tests:

```bash
node --test tests/*.test.mjs
```

## Debugging Poor Results

1. Normalize the user query with `normalizeQuery(...)`.
2. Check detected intent with `detectSearchIntent(...)`.
3. Confirm enough candidates are loaded by `searchPlaces(...)`.
4. Inspect the ranked output from `searchPlaceRecords(...)`.
5. If the right records are missing entirely, fix data enrichment first: category, tags, amenities, or structured WiFi/free-WiFi fields.
6. Add or update regression tests before changing weights or synonyms.
