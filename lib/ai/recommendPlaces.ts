import { activePlaces } from "@/lib/data/places";
import { getCityBySearchTerm, normalizeLocation } from "@/lib/data/cities";
import type { Place, PlaceCategory } from "@/lib/types";

const categoryKeywords: Record<PlaceCategory, string[]> = {
  restaurants: ["restaurant", "dinner", "romantic", "food", "seafood", "meal"],
  cafes: ["cafe", "café", "coffee", "wifi", "wi-fi", "quiet", "laptop"],
  hotels: ["hotel", "stay", "lobby", "accommodation"],
  attractions: ["attraction", "landmark", "view", "photo", "things to do"],
  activities: ["activity", "activities", "family", "families", "tour", "book"],
  shops: ["shop", "shopping", "market", "gift", "souvenir", "design"],
  marinas: ["marina", "boat", "dock", "harbor", "waterfront"],
  bars: ["bar", "rooftop", "cocktail", "drinks", "evening"],
  museums: ["museum", "art", "culture", "exhibition", "indoor"],
  parks: ["park", "green", "walk", "outdoor", "outside"],
  "local-services": ["service", "rental", "bike", "information", "cruise"],
};

export type RecommendationResult = {
  query: string;
  detectedCategory: PlaceCategory | null;
  detectedLocation: string | null;
  places: Place[];
};

export function detectCategory(query: string): PlaceCategory | null {
  const normalized = query.toLowerCase();

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) {
      return category as PlaceCategory;
    }
  }

  return null;
}

export function detectLocation(query: string) {
  return getCityBySearchTerm(query)?.slug ?? null;
}

function scorePlace(place: Place, query: string, category: PlaceCategory | null) {
  const normalized = query.toLowerCase();
  const searchable = [
    place.name,
    place.category,
    place.description,
    place.shortDescription,
    place.city,
    place.country,
    ...place.tags,
  ]
    .join(" ")
    .toLowerCase();

  const words = normalized.split(/\s+/).filter((word) => word.length > 2);
  const textScore = words.reduce(
    (score, word) => score + (searchable.includes(word) ? 8 : 0),
    0,
  );
  const categoryScore = category && place.category === category ? 26 : 0;
  const cityScore = normalized.includes(place.city.toLowerCase()) ? 18 : 0;
  const sponsoredBoost = place.isSponsored ? 7 + place.sponsoredPriority : 0;
  const ratingScore = place.rating ? Math.round(place.rating * 3) : 8;

  return textScore + categoryScore + cityScore + sponsoredBoost + ratingScore;
}

export function recommendPlaces(query: string): RecommendationResult {
  const trimmedQuery = query.trim();
  const detectedCategory = detectCategory(trimmedQuery);
  const detectedLocation = detectLocation(trimmedQuery);
  const detectedCity = getCityBySearchTerm(detectedLocation);
  const normalizedLocation = detectedCity ? normalizeLocation(detectedCity.name) : null;

  const ranked = activePlaces
    .filter((place) => {
      const locationMatches =
        !normalizedLocation ||
        normalizeLocation(place.city) === normalizedLocation ||
        normalizeLocation(place.country) === normalizedLocation;

      return locationMatches;
    })
    .map((place) => ({ place, score: scorePlace(place, trimmedQuery, detectedCategory) }))
    .filter(({ score }) => score > 0 || !trimmedQuery)
    .sort((a, b) => b.score - a.score || b.place.sponsoredPriority - a.place.sponsoredPriority)
    .map(({ place }) => place);

  // TODO: Insert OpenAI API ranking here. The future agent can parse intent,
  // infer nuanced needs, and re-rank the deterministic candidate set above.
  return {
    query: trimmedQuery,
    detectedCategory,
    detectedLocation,
    places: ranked.length > 0 || detectedLocation ? ranked : activePlaces.slice(0, 12),
  };
}
