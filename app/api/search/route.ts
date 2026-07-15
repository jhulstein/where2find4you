import { NextResponse } from "next/server";
import { searchPlaces } from "@/lib/search/searchService";
import { createSearchRecord, logImpressions } from "@/lib/tracking";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const { searchParams } = new URL(request.url);
  const userLatitude = Number(searchParams.get("lat"));
  const userLongitude = Number(searchParams.get("lon"));
  const userLocation =
    Number.isFinite(userLatitude) && Number.isFinite(userLongitude)
      ? { latitude: userLatitude, longitude: userLongitude }
      : null;
  const radiusParam = searchParams.get("radius");
  const radius = radiusParam === null ? Number.NaN : Number(radiusParam);
  const radiusKm = userLocation
    ? Number.isFinite(radius)
      ? Math.max(0.1, Math.min(radius, 100))
      : 0.5
    : null;
  const limitParam = searchParams.get("limit");
  const offsetParam = searchParams.get("offset");
  const limit = limitParam === null ? Number.NaN : Number(limitParam);
  const offset = offsetParam === null ? Number.NaN : Number(offsetParam);
  const filters = [
    ...searchParams.getAll("filter"),
    ...searchParams.getAll("filters"),
    searchParams.has("free_wifi") ? "free_wifi" : null,
  ].filter((filter): filter is string => Boolean(filter));
  const searchResult = await searchPlaces({
    category: searchParams.get("category"),
    debug: searchParams.get("debug") === "1",
    filters,
    limit: Number.isFinite(limit) ? limit : 100,
    location: searchParams.get("location"),
    maxRadiusKm: radiusKm,
    offset: Number.isFinite(offset) ? offset : 0,
    query: searchParams.get("q"),
    sort: searchParams.get("sort"),
    userLocation,
  });
  const results = searchResult.results;
  const search = await createSearchRecord({
    query: searchParams.get("q")?.trim() || "all places",
    normalizedQuery: searchResult.normalizedQuery,
    detectedCategory: searchResult.detectedCategory,
    detectedLocation: searchResult.detectedLocation,
    resultCount: searchResult.totalCount,
    filtersUsed: searchResult.filtersUsed,
    userLocationAvailable: searchResult.userLocationAvailable,
    latencyMs: Date.now() - startedAt,
    sessionId: request.headers.get("x-session-id") ?? undefined,
  });
  const impressions = await logImpressions({
    places: results.map((place) => ({ id: place.id, isSponsored: place.isSponsored })),
    searchId: search.id,
    sessionId: search.sessionId,
  });

  return NextResponse.json({
    search,
    impressions,
    results,
    totalCount: searchResult.totalCount,
    page: searchResult.page,
    pageSize: searchResult.pageSize,
    debug: searchParams.get("debug") === "1" ? searchResult.debug : undefined,
  });
}
