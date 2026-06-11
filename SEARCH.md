# Search v2

Search is centralized in `lib/search/searchService.ts`.

The production search architecture is now:

1. The application database/Supabase remains the source of truth.
2. Typesense is the primary search index.
3. `searchPlaces(...)` normalizes the query, detects intent, builds Typesense parameters, calls Typesense, and returns results.
4. If Typesense is not configured or unavailable, `searchPlaces(...)` falls back to the existing Supabase/static/OpenStreetMap path.
5. Search analytics still run through `lib/tracking.ts`.

Do not add one-off search logic to UI components, API routes, or page code.

## Current Flow

1. The UI submits `/search` through `components/SearchBar.tsx`.
2. `app/search/page.tsx` calls `searchPlaces(...)`.
3. `app/api/search/route.ts` also calls `searchPlaces(...)`.
4. `searchPlaces(...)` tries `searchTypesensePlaces(...)` first.
5. Typesense uses the collection schema, query builder, document mapper, and synonyms in `lib/search/typesenseCore.js`.
6. If Typesense fails or is not configured, the fallback path uses Supabase RPC/static seed data/OpenStreetMap and the local ranker in `lib/search/ranking.js`.

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

The Supabase `places` table stores name, category, tags, descriptions, address, latitude/longitude, rating, opening hours, sponsorship, active status, and timestamps. Optional structured fields such as `amenities`, `features`, `hasWifi`, `freeWifi`, and `isVerified` are supported in the Typesense document mapper and can be added to the database later.

## Typesense Document

`createTypesensePlaceDocument(...)` indexes:

- `id`
- `recordId`
- `name`
- `normalizedName`
- `description`
- `shortDescription`
- `category`
- `normalizedCategory`
- `categoryAliases`
- `tags`
- `normalizedTags`
- `amenities`
- `normalizedAmenities`
- `features`
- `normalizedFeatures`
- `searchText`
- `address`
- `city`
- `country`
- `location`
- `hasWifi`
- `freeWifi`
- `publicWifi`
- `rating`
- `popularity`
- `verified`
- `openNow`
- `isSponsored`
- `sponsoredPriority`
- `isActive`
- `updatedAt`

Category, tags, amenities, city, country, WiFi booleans, verified/open state, source and active status are configured as filter/facet fields where useful. Rating, popularity, sponsorship priority and updated time are sortable tie-break fields.

## Typesense Querying

The backend uses:

- `query_by` across normalized/raw name, category, category aliases, tags, amenities, features, search text, description and address.
- `query_by_weights` so name/category/tags/amenities outrank description.
- `num_typos=2` for typo tolerance.
- `prefix=true` for partial/prefix matching.
- `prioritize_exact_match=true`.
- `filter_by` for active records, category filters, city/location, WiFi filters and rooftop filters.
- `sort_by` beginning with `_text_match:desc`, then optional geo distance and only then verified/rating/popularity/freshness.

Core rule: relevance comes first. Distance, popularity, rating, verified status, freshness and opening status must not overpower text/category/amenity relevance.

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

Intent detection lives in `lib/search/ranking.js`.
Typesense synonyms are built from those intents in `typesenseSynonyms`.

Restaurant intent:

- `restaurant`
- `restaurants`
- `resturant`
- `resturants`
- `restauranter`
- `restauranger`
- `restaurang`
- `spisested`
- `spisesteder`
- `dinner`
- `food`
- `meal`
- `seafood`
- `middag`
- `mat`

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

## Sync And Backfill

Full reindex:

```bash
npm run search:reindex
```

The script:

1. Reads active places from Supabase when `NEXT_PUBLIC_SUPABASE_URL` and a Supabase secret/service key are configured.
2. Falls back to seed data for local development.
3. Ensures the Typesense collection exists.
4. Upserts Typesense synonyms.
5. Imports active places using `action=upsert`.

Dry run:

```bash
node scripts/reindex-typesense.mjs --dry-run
```

Force seed data:

```bash
node scripts/reindex-typesense.mjs --source=seed
```

Force Supabase:

```bash
node scripts/reindex-typesense.mjs --source=supabase
```

Incremental sync:

- `syncTypesensePlace(place)` upserts active places.
- `syncTypesensePlace(place)` removes inactive places.
- `removeTypesensePlace(recordId)` deletes records.
- `reindexTypesensePlaces(places)` backfills a batch.

The current admin write route is still a placeholder. When real create/update/delete writes are added, call the sync functions after the database commit. If a future job queue is added, failed sync jobs should be retried there. Until then, indexing failures are logged and the fallback search path keeps the product usable.

## Environment

Server-side only:

```env
TYPESENSE_HOST=
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=
TYPESENSE_SEARCH_ONLY_API_KEY=
TYPESENSE_COLLECTION=places_v1
```

Do not expose `TYPESENSE_API_KEY` to the browser. The app currently searches server-side, so the frontend does not need a Typesense key.

## Local Development

Start Typesense locally:

```bash
docker compose -f docker-compose.typesense.yml up
```

Use:

```env
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=local-typesense-admin-key
TYPESENSE_COLLECTION=places_v1
```

Then run:

```bash
npm run search:reindex
```

## Debugging Poor Results

1. Call `/api/search?q=...&debug=1`.
2. Check `debug.parameters` to confirm `query_by`, `filter_by`, `sort_by`, page and typo settings.
3. Check `debug.hits` for Typesense text match order.
4. Confirm the expected record exists in Typesense by reindexing.
5. If the right record is missing from the source database, fix data enrichment first.
6. If the record exists but fields are weak, improve category, tags, amenities, features or structured WiFi booleans.
7. Add or update regression tests before changing weights, synonyms or normalization.

## Known Regression Queries

- `restaurant`
- `restaurants`
- `restauranter`
- `restauranger`
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

Focused search tests:

```bash
node --test tests/search-v2.test.mjs tests/search-ranking.test.mjs tests/search-relevance-suite.test.mjs tests/typesense-search.test.mjs
```

All tests:

```bash
node --test tests/*.test.mjs
```

## Data Quality Notes

Typesense cannot invent missing records. If production still has too few café, restaurant or WiFi results after this system is deployed, the next fix is data enrichment:

- more real records
- correct category tags
- structured amenity tags
- `hasWifi` / `freeWifi` / `publicWifi`
- consistent cafe/café/coffee shop labels
- consistent WiFi/free-WiFi labels
