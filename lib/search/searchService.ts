import { getPlaceAnalytics } from "@/lib/analytics";
import { cities, getCityBySearchTerm } from "@/lib/data/cities";
import { activePlaces } from "@/lib/data/places";
import { searchOsmPlaces } from "@/lib/search/osmPlaces";
import {
  DEFAULT_SEARCH_RADIUS_KM,
  detectSearchIntent,
  isBroadIntentSearch,
  matchesSearchIntent,
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
export type SearchAmenityFilterId = "free_wifi";

export type SearchCoordinates = {
  latitude: number;
  longitude: number;
};

export type SearchServiceInput = {
  category?: string | null;
  debug?: boolean;
  filters?: string | string[] | null;
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
  filters: SearchAmenityFilterId[];
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

function normalizeCategory(value: SearchServiceInput["category"]): SearchFilterId {
  const normalized = normalizeQuery(value ?? "").replaceAll(" ", "-").replaceAll("_", "-");

  if (normalized === "restaurant" || normalized === "restaurants") {
    return "restaurants";
  }

  if (normalized === "free-wifi" || normalized === "freewifi") {
    return "all";
  }

  return normalizeSearchFilter(value ?? undefined);
}

function normalizeFilters(
  filters: SearchServiceInput["filters"],
  category: SearchServiceInput["category"],
): SearchAmenityFilterId[] {
  const rawFilters = Array.isArray(filters) ? filters : filters ? [filters] : [];
  const categoryFilter = normalizeQuery(category ?? "").replaceAll(" ", "_").replaceAll("-", "_");

  if (categoryFilter === "free_wifi" || categoryFilter === "freewifi") {
    rawFilters.push("free_wifi");
  }

  return Array.from(
    new Set(
      rawFilters
        .flatMap((filter) => filter.split(","))
        .map((filter) => filter.trim().toLowerCase().replaceAll("-", "_"))
        .filter((filter): filter is SearchAmenityFilterId => filter === "free_wifi"),
    ),
  );
}

function pageSizeFor(input: SearchServiceInput) {
  const requested = input.pageSize ?? input.limit ?? 100;

  if (!Number.isFinite(requested)) {
    return 100;
  }

  return Math.max(1, Math.min(Math.trunc(requested), 250));
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

const restaurantSearchCategories: SearchFilterId[] = ["restaurants", "cafes", "bars"];

function searchCategoriesFor(category: SearchFilterId) {
  return category === "restaurants" ? restaurantSearchCategories : [category];
}

function cityFromUserLocation(userLocation: SearchCoordinates | null | undefined): City | null {
  if (!userLocation) {
    return null;
  }

  return {
    id: "near-me",
    name: "Nearby",
    slug: "near-me",
    country: "",
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
  };
}

function osmCategoriesFor(category: SearchFilterId, filters: SearchAmenityFilterId[]) {
  const categories = searchCategoriesFor(category);

  if (filters.includes("free_wifi")) {
    return Array.from(new Set([...categories, "free-wifi" as SearchFilterId]));
  }

  return categories;
}

function placeMatchesAdditionalFilters(place: Place, filters: SearchAmenityFilterId[]) {
  if (filters.length === 0) {
    return true;
  }

  return filters.every((filter) => {
    if (filter === "free_wifi") {
      return matchesSearchIntent(place, "free-wifi") || matchesSearchIntent(place, "wifi");
    }

    return true;
  });
}

async function searchFallbackPlaces(input: SearchServiceInput & {
  category: SearchFilterId;
  city: City | null;
  filters: SearchAmenityFilterId[];
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
    filters,
    normalizedQuery,
    offset,
    page,
    pageSize,
    radiusKm,
    sort,
  } = input;
  const intent = detectSearchIntent(normalizedQuery);
  const candidateLimit = Math.max(100, Math.min(pageSize + offset + 150, 250));
  const databaseRequests = new Map<string, ReturnType<typeof searchSupabasePlaces>>();
  const addDatabaseRequest = (searchCategory: SearchFilterId, query: string) => {
    const key = `${searchCategory}:${query}`;

    if (databaseRequests.has(key)) {
      return;
    }

    databaseRequests.set(
      key,
      searchSupabasePlaces({
        category: searchCategory,
        limit: candidateLimit,
        location: city,
        offset: 0,
        query,
        radiusKm,
        userLocation: input.userLocation,
      }),
    );
  };

  for (const searchCategory of searchCategoriesFor(category)) {
    addDatabaseRequest(searchCategory, normalizedQuery);
  }

  if (filters.includes("free_wifi")) {
    addDatabaseRequest("free-wifi", "wifi");
  }

  if (
    intent.detectedCategory &&
    (category === "all" || category === intent.detectedCategory)
  ) {
    addDatabaseRequest(intent.detectedCategory, "");
  }

  if (intent.hasWifiIntent || intent.hasFreeWifiIntent || category === "free-wifi") {
    addDatabaseRequest("free-wifi", "wifi");
  }

  const databaseSearches = (await Promise.all(databaseRequests.values())).filter(
    (result): result is NonNullable<typeof result> => result !== null,
  );
  const databasePlaces = mergePlaces(
    ...databaseSearches.map((result) => result.places),
  );
  const usesDatabase = databaseSearches.length > 0;
  const osmSearchCity = city ?? cityFromUserLocation(input.userLocation);
  const shouldFetchOsmPlaces =
    input.includeOsmFallback !== false &&
    Boolean(osmSearchCity && (normalizedQuery || category !== "all" || filters.length > 0)) &&
    (!usesDatabase || databasePlaces.length < Math.max(8, pageSize));
  const osmPlaces = shouldFetchOsmPlaces
    ? mergePlaces(
        ...(await Promise.all(
          osmCategoriesFor(category, filters).map((osmCategory) =>
            searchOsmPlaces({
              category: osmCategory,
              city: osmSearchCity,
              detectedCategory: intent.detectedCategory,
              limit: Math.max(36, pageSize),
              query: normalizedQuery,
              radiusKm: city ? undefined : radiusKm,
            }),
          ),
        )),
      )
    : [];
  const sourcePlaces = usesDatabase ? databasePlaces : activePlaces;
  const candidates = mergePlaces(sourcePlaces, osmPlaces).filter((place) =>
    placeMatchesAdditionalFilters(place, filters),
  );
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
    filters,
    filtersUsed: {
      category,
      filters: filters.join(",") || null,
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
  const category = normalizeCategory(input.category ?? undefined);
  const filters = normalizeFilters(input.filters, input.category ?? undefined);
  const sort = normalizeSort(input.sort);
  const city = findSearchCity(input, normalizedQuery, category);
  const effectiveUserLocation = city ? null : input.userLocation;
  const pageSize = pageSizeFor(input);
  const offset = offsetFor(input, pageSize);
  const page = Math.floor(offset / pageSize) + 1;
  const radiusKm = radiusFor(input);
  const canUseTypesense = category !== "restaurants" && filters.length === 0;
  const typesenseSearch = canUseTypesense
    ? await searchTypesensePlaces({
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
      })
    : null;

  if (typesenseSearch) {
    const typesenseResult: SearchServiceResult = {
      category,
      city,
      debug: typesenseSearch.debug,
      detectedCategory: intent.detectedCategory,
      detectedLocation: city?.slug ?? null,
      filters,
      filtersUsed: {
        category,
        filters: filters.join(",") || null,
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
    const shouldBroaden =
      isBroadIntentSearch(normalizedQuery) &&
      typesenseResult.totalCount < Math.min(4, pageSize);

    if (!shouldBroaden) {
      return typesenseResult;
    }

    const fallbackResult = await searchFallbackPlaces({
      ...input,
      category,
      city,
      filters,
      normalizedQuery,
      offset,
      page,
      pageSize,
      radiusKm,
      sort,
      userLocation: effectiveUserLocation,
    });

    return fallbackResult.totalCount > typesenseResult.totalCount
      ? fallbackResult
      : typesenseResult;
  }

  return searchFallbackPlaces({
    ...input,
    category,
    city,
    filters,
    normalizedQuery,
    offset,
    page,
    pageSize,
    radiusKm,
    sort,
    userLocation: effectiveUserLocation,
  });
}
