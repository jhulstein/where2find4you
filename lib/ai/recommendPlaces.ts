import { activePlaces } from "@/lib/data/places";
import { getCityBySearchTerm, normalizeLocation } from "@/lib/data/cities";
import { detectSearchIntent, normalizeQuery, queryTerms, rankPlaces } from "@/lib/search/ranking";
import type { Place, PlaceCategory } from "@/lib/types";

export type RecommendationResult = {
  query: string;
  detectedCategory: PlaceCategory | null;
  detectedLocation: string | null;
  places: Place[];
};

export function detectCategory(query: string): PlaceCategory | null {
  return detectSearchIntent(query).detectedCategory;
}

export function detectLocation(query: string) {
  return getCityBySearchTerm(query)?.slug ?? null;
}

export function recommendPlaces(query: string): RecommendationResult {
  const normalizedQuery = normalizeQuery(query);
  const detectedCategory = detectCategory(normalizedQuery);
  const detectedLocation = detectLocation(normalizedQuery);
  const detectedCity = getCityBySearchTerm(detectedLocation);
  const normalizedLocation = detectedCity ? normalizeLocation(detectedCity.name) : null;
  const candidatePlaces = activePlaces.filter((place) => {
    if (!normalizedLocation) {
      return true;
    }

    return normalizeLocation(place.city) === normalizedLocation;
  });
  const ranked = rankPlaces(candidatePlaces, {
    category: detectedCategory ?? "all",
    location: detectedCity,
    query: normalizedQuery,
  });
  const relevant = ranked.filter((item) => item.isRelevant);
  const hasSearchTerms = queryTerms(normalizedQuery, { location: detectedCity }).length > 0;
  const places = relevant.length > 0 || (normalizedQuery && hasSearchTerms)
    ? relevant.map((item) => item.place)
    : ranked.map((item) => item.place);

  return {
    query: normalizedQuery,
    detectedCategory,
    detectedLocation,
    places,
  };
}
