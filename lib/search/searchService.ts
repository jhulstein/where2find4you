import { getPlaceAnalytics } from "@/lib/analytics";
import { cities, getCityBySearchTerm } from "@/lib/data/cities";
import { activePlaces } from "@/lib/data/places";
import { searchOsmPlaces } from "@/lib/search/osmPlaces";
import {
  DEFAULT_SEARCH_RADIUS_KM,
  detectSearchIntent,
  normalizeQuery,
  searchPlaceRecords,
} from "@/lib/search/ranking";
import {
  searchTypesensePlaces,
  type TypesenseSearchDebugHit,
} from "@/lib/search/typesenseClient";
import {
  normalizeSearchFilter,
  type SearchFilterId,
} from "@/lib/searchFilters";
import { searchSupabasePlaces } from "@/lib/supabase/search";
import type { City, Place, PlaceCategory } from "@/lib/types";

export type SearchSort = "relevance" | "popularity" | "newest";

export type SearchCoordinates = {
  latitude: number;
  longitude: number;
};

export type SearchServiceInput = {
  category?: string | null;
  debug?: boolean;
  includeOsmFallback?: boolean;
  limit?: number;
  location?: string | null;
  maxRadiusKm?: number | null;
  offset?: number;
  page?: number;
  pageSize?: number;
  query?: string | null;
  sort?: SearchSort | string | null;
  userLocation?: SearchCoordinates | null;
};

export type SearchServiceResult = {
  category: SearchFilterId;
  city: City | null;
  detectedCategory: PlaceCategory | null;
  detectedLocation: string | null;
  filtersUsed: Record<string, string | number | boolean | null>;
  normalizedQuery: string;
  offset: number;
  page: number;
  pageSize: number;
  query: string;
  results: Place[];
  source:
    | "typesense"
    | "supabase"
    | "supabase+openstreetmap"
    | "static"
    | "static+openstreetmap";
  sort: SearchSort;
  totalCount: number;
  userLocationAvailable: boolean;
  debug?: {
    hits: TypesenseSearchDebugHit[];
    parameters: Record<string, string>;
  };
};

function placeMergeKey(place: Place) {
  return [
    normalizeQuery(place.name),
    normalizeQuery(place.city),
    Number(place.latitude).toFixed(4),
    Number(place.longitude).toFixed(4),
  ].join("-");
}

function mergePlaces(...placeGroups: Place[][]) {
  const seen = new Set<string>();

  return placeGroups.flat().filter((place) => {
    const key = placeMergeKey(place);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function normalizeSort(value: SearchServiceInput["sort"]): SearchSort {
  return value === "popularity" || value === "newest" ? value : "relevance";
}

function pageSizeFor(input: SearchServiceInput) {
  const requested = input.pageSize ?? input.limit ?? 80;

  if (!Number.isFinite(requested)) {
    return 80;
  }

  return Math.max(1, Math.min(Math.trunc(requested), 150));
}

function offsetFor(input: SearchServiceInput, pageSize: number) {
  if (Number.isFinite(input.offset)) {
    return Math.max(0, Math.trunc(input.offset ?? 0));
  }

  if (Number.isFinite(input.page)) {
    return Math.max(0, (Math.trunc(input.page ?? 1) - 1) * pageSize);
  }

  return 0;
}

function radiusFor(input: SearchServiceInput) {
  const requested = input.maxRadiusKm;

  if (!Number.isFinite(requested)) {
    return DEFAULT_SEARCH_RADIUS_KM;
  }

  return Math.max(1, Math.min(Math.trunc(requested ?? DEFAULT_SEARCH_RADIUS_KM), 100));
}

function findSearchCity(input: SearchServiceInput, normalizedQuery: string, category: SearchFilterId) {
  const selectedCity =
    getCityBySearchTerm(input.location) ??
    getCityBySearchTerm(normalizedQuery);

  if (selectedCity) {
    return selectedCity;
  }

  if (input.userLocation) {
    return null;
  }

  return category !== "all" ? cities[0] : null;
}

async function searchFallbackPlaces(input: SearchServiceInput & {
  category: SearchFilterId;
  city: City | null;
  normalizedQuery: string;
  offset: number;
  page: number;
  pageSize: number;
  radiusKm: number;
  sort: SearchSort;
}): Promise<SearchServiceResult> {
  const {
    category,
    city,
    normalizedQuery,
    offset,
    page,
    pageSize,
    radiusKm,
    sort,
  } = input;
  const intent = detectSearchIntent(normalizedQuery);
  const candidateLimit = Math.max(80, Math.min(pageSize + offset + 80, 180));
  const databaseRequests = [
    searchSupabasePlaces({
      category,
      limit: candidateLimit,
      location: city,
      offset: 0,
      query: normalizedQuery,
      radiusKm,
      userLocation: input.userLocation,
    }),
  ];

  if (
    intent.detectedCategory &&
    (category === "all" || category === intent.detectedCategory)
  ) {
    databaseRequests.push(
      searchSupabasePlaces({
        category: intent.detectedCategory,
        limit: candidateLimit,
        location: city,
        offset: 0,
        query: "",
        radiusKm,
        userLocation: input.userLocation,
      }),
    );
  }

  if (intent.hasWifiIntent || intent.hasFreeWifiIntent || category === "free-wifi") {
    databaseRequests.push(
      searchSupabasePlaces({
        category: "free-wifi",
        limit: candidateLimit,
        location: city,
        offset: 0,
        query: "wifi",
        radiusKm,
        userLocation: input.userLocation,
      }),
    );
  }

  const databaseSearches = (await Promise.all(databaseRequests)).filter(
    (result): result is NonNullable<typeof result> => result !== null,
  );
  const databasePlaces = mergePlaces(
    ...databaseSearches.map((result) => result.places),
  );
  const usesDatabase = databaseSearches.length > 0;
  const shouldFetchOsmPlaces =
    input.includeOsmFallback !== false &&
    Boolean(city && (normalizedQuery || category !== "all")) &&
    (!usesDatabase || databasePlaces.length < Math.max(8, pageSize));
  const osmPlaces = shouldFetchOsmPlaces
    ? await searchOsmPlaces({
        category,
        city,
        detectedCategory: intent.detectedCategory,
        limit: Math.max(36, pageSize),
        query: normalizedQuery,
      })
    : [];
  const sourcePlaces = usesDatabase ? databasePlaces : activePlaces;
  const candidates = mergePlaces(sourcePlaces, osmPlaces);
  const search = searchPlaceRecords(candidates, {
    category,
    getPopularityScore: (place) => getPlaceAnalytics(place).impressions,
    limit: pageSize,
    location: city,
    maxRadiusKm: radiusKm,
    offset,
    query: normalizedQuery,
    sort,
    userLocation: input.userLocation,
  });
  const source = usesDatabase
    ? shouldFetchOsmPlaces
      ? "supabase+openstreetmap"
      : "supabase"
    : shouldFetchOsmPlaces
      ? "static+openstreetmap"
      : "static";

  return {
    category,
    city,
    detectedCategory: intent.detectedCategory,
    detectedLocation: city?.slug ?? null,
    filtersUsed: {
      category,
      location: city?.slug ?? input.location ?? null,
      offset,
      page,
      pageSize,
      radiusKm,
      sort,
      source,
    },
    normalizedQuery,
    offset,
    page,
    pageSize,
    query: input.query?.trim() ?? "",
    results: search.results,
    source,
    sort,
    totalCount: search.totalCount,
    userLocationAvailable: Boolean(input.userLocation),
  };
}

export async function searchPlaces(input: SearchServiceInput = {}): Promise<SearchServiceResult> {
  const rawQuery = input.query?.trim() ?? "";
  const normalizedQuery = normalizeQuery(rawQuery);
  const intent = detectSearchIntent(normalizedQuery);
  const category = normalizeSearchFilter(input.category ?? undefined);
  const sort = normalizeSort(input.sort);
  const city = findSearchCity(input, normalizedQuery, category);
  const effectiveUserLocation = city ? null : input.userLocation;
  const pageSize = pageSizeFor(input);
  const offset = offsetFor(input, pageSize);
  const page = Math.floor(offset / pageSize) + 1;
  const radiusKm = radiusFor(input);
  const typesenseSearch = await searchTypesensePlaces({
    category,
    debug: input.debug,
    limit: pageSize,
    location: city,
    offset,
    page,
    pageSize,
    query: normalizedQuery,
    radiusKm,
    sort,
    userLocation: effectiveUserLocation,
  });

  if (typesenseSearch) {
    return {
      category,
      city,
      debug: typesenseSearch.debug,
      detectedCategory: intent.detectedCategory,
      detectedLocation: city?.slug ?? null,
      filtersUsed: {
        category,
        location: city?.slug ?? input.location ?? null,
        offset,
        page,
        pageSize,
        radiusKm,
        sort,
        source: "typesense",
      },
      normalizedQuery,
      offset,
      page,
      pageSize,
      query: rawQuery,
      results: typesenseSearch.places,
      source: "typesense",
      sort,
      totalCount: typesenseSearch.totalCount,
      userLocationAvailable: Boolean(effectiveUserLocation),
    };
  }

  return searchFallbackPlaces({
    ...input,
    category,
    city,
    normalizedQuery,
    offset,
    page,
    pageSize,
    radiusKm,
    sort,
    userLocation: effectiveUserLocation,
  });
}
