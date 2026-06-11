# Project Rules

## Search

Search is a core product feature for wher2find4you. Do not change search with one-off UI hacks or isolated keyword patches.

- All search behavior must go through the shared SearchService/search module.
- Typesense is the primary search index. The application database remains the source of truth.
- Keep query normalization, synonym/intent detection, Typesense query building, filtering, ranking, sync and pagination centralized.
- Every search behavior change must include regression tests.
- Keep `SEARCH.md` updated when ranking, synonyms, normalization, Typesense schema, indexing, sync, fallback or search behavior changes.
- Do not expose Typesense admin API keys to browser/client code.
- Relevance comes first. Distance, popularity, rating, verified status, freshness, opening status, and sponsorship may only act as boosts or tie-breakers after relevance is established.
- Known critical regression queries: `restaurant`, `restaurants`, `restauranter`, `restauranger`, `cafe`, `cafe’s`, `café`, `coffee`, `coffee shop`, `kafé`, `kaffebar`, `free WiFi`, `wifi`, `wi-fi`, `wireless internet`, `wlan`.
