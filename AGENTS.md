# Project Rules

## Search

Search is a core product feature for wher2find4you. Do not change search with one-off UI hacks or isolated keyword patches.

- All search behavior must go through the shared SearchService/search module.
- Keep query normalization, synonym/intent detection, filtering, ranking, and pagination centralized.
- Every search behavior change must include regression tests.
- Keep `SEARCH.md` updated when ranking, synonyms, normalization, indexes, or search behavior changes.
- Relevance comes first. Distance, popularity, rating, verified status, freshness, opening status, and sponsorship may only act as boosts or tie-breakers after relevance is established.
- Known critical regression queries: `restaurant`, `restaurants`, `restauranter`, `restauranger`, `cafe`, `cafe’s`, `café`, `coffee`, `coffee shop`, `kafé`, `kaffebar`, `free WiFi`, `wifi`, `wi-fi`, `wireless internet`, `wlan`.
