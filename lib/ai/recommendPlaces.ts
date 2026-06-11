import { activePlaces } from "@/lib/data/places";
import { getCityBySearchTerm, normalizeLocation } from "@/lib/data/cities";
import { normalizeQuery, queryTerms, rankPlaces } from "@/lib/search/ranking";
import type { Place, PlaceCategory } from "@/lib/types";

const categoryKeywords: Record<PlaceCategory, string[]> = {
  restaurants: ["restaurant", "restaurants", "dinner", "food", "seafood", "meal"],
  cafes: ["cafe", "cafes", "café", "cafés", "coffee", "wifi"],
  hotels: ["hotel", "hotels", "stay", "lobby", "accommodation"],
  attractions: ["attraction", "attractions", "landmark", "view", "photo", "things to do"],
  activities: ["activity", "activities", "family", "families", "tour", "experience"],
  shops: ["shop", "shops", "shopping", "market", "gift", "souvenir", "design"],
  marinas: ["marina", "marinas", "boat", "dock", "harbor", "waterfront"],
  bars: ["bar", "bars", "rooftop", "cocktail", "drinks", "evening"],
  museums: ["museum", "museums", "art", "culture", "exhibition", "indoor"],
  parks: ["park", "parks", "green", "walk", "outdoor", "outside"],
  "local-services": ["service", "services", "rental", "bike", "information", "cruise"],
};

export type RecommendationResult = {
  query: string;
  detectedCategory: PlaceCategory | null;
  detectedLocation: string | null;
  places: Place[];
};

export function detectCategory(query: string): PlaceCategory | null {
  const normalized = normalizeQuery(query);

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => normalized.includes(normalizeQuery(keyword)))) {
      return category as PlaceCategory;
    }
  }

  return null;
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
