import { NextResponse } from "next/server";
import { recommendPlaces } from "@/lib/ai/recommendPlaces";
import { getPlaceAnalytics } from "@/lib/analytics";
import { getCityBySearchTerm, normalizeLocation } from "@/lib/data/cities";
import { activePlaces } from "@/lib/data/places";
import { compareRankedPlaces, normalizeQuery, rankPlaces } from "@/lib/search/ranking";
import { matchesSearchFilter, normalizeSearchFilter } from "@/lib/searchFilters";
import { searchSupabasePlaces } from "@/lib/supabase/search";
import { createSearchRecord, logImpressions } from "@/lib/tracking";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const { searchParams } = new URL(request.url);
  const query = normalizeQuery(searchParams.get("q") ?? "");
  const category = normalizeSearchFilter(searchParams.get("category") ?? undefined);
  const sort = searchParams.get("sort") ?? "relevance";
  const result = recommendPlaces(query);
  const cityForSearch =
    getCityBySearchTerm(searchParams.get("location")) ??
    getCityBySearchTerm(query) ??
    getCityBySearchTerm(result.detectedLocation);
  const userLatitude = Number(searchParams.get("lat"));
  const userLongitude = Number(searchParams.get("lon"));
  const userLocation =
    Number.isFinite(userLatitude) && Number.isFinite(userLongitude)
      ? { latitude: userLatitude, longitude: userLongitude }
      : null;
  const databaseSearch = await searchSupabasePlaces({
    category,
    limit: 100,
    location: cityForSearch,
    query,
    userLocation,
  });
  const basePlaces = databaseSearch?.places ?? activePlaces;
  const filtered = basePlaces.filter((place) => {
    const locationMatches =
      !cityForSearch ||
      normalizeLocation(place.city) === normalizeLocation(cityForSearch.name);
    return matchesSearchFilter(place, category) && locationMatches;
  });
  const ranked = rankPlaces(filtered, {
    category,
    getPopularityScore: (place) => getPlaceAnalytics(place).impressions,
    location: cityForSearch,
    query,
    userLocation,
  }).filter((item) => item.isRelevant || !query);
  const sorted = [...ranked].sort((a, b) => {
    if (!query && category === "all" && !cityForSearch) {
      return b.place.sponsoredPriority - a.place.sponsoredPriority;
    }

    if (sort === "popularity" && !query) {
      return (
        getPlaceAnalytics(b.place).impressions - getPlaceAnalytics(a.place).impressions ||
        compareRankedPlaces(a, b)
      );
    }

    if (sort === "newest" && !query) {
      return Date.parse(b.place.createdAt) - Date.parse(a.place.createdAt) || compareRankedPlaces(a, b);
    }

    return compareRankedPlaces(a, b);
  });
  const results = sorted.map((item) => item.place);
  const search = await createSearchRecord({
    query: searchParams.get("q")?.trim() || "all places",
    normalizedQuery: query,
    detectedCategory: result.detectedCategory,
    detectedLocation: result.detectedLocation,
    resultCount: results.length,
    filtersUsed: {
      category,
      location: cityForSearch?.slug ?? searchParams.get("location") ?? null,
      sort,
      source: databaseSearch ? "supabase" : "static",
    },
    userLocationAvailable: Boolean(userLocation),
    latencyMs: Date.now() - startedAt,
    sessionId: request.headers.get("x-session-id") ?? undefined,
  });
  const impressions = await logImpressions({
    places: results.map((place) => ({ id: place.id, isSponsored: place.isSponsored })),
    searchId: search.id,
    sessionId: search.sessionId,
  });

  return NextResponse.json({ search, impressions, results });
}
