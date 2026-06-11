import { activePlaces } from "@/lib/data/places";
import { cities, getCityBySearchTerm, normalizeLocation } from "@/lib/data/cities";
import type { Place, PlaceCategory } from "@/lib/types";

const categoryKeywords: Record<PlaceCategory, string[]> = {
  restaurants: ["restaurant", "restaurants", "dinner", "food", "seafood", "meal"],
  cafes: ["cafe", "cafes", "café", "cafés", "coffee"],
  hotels: ["hotel", "stay", "lobby", "accommodation"],
  attractions: ["attraction", "landmark", "view", "photo", "things to do"],
  activities: ["activity", "activities", "family", "families", "tour"],
  shops: ["shop", "shopping", "market", "gift", "souvenir", "design"],
  marinas: ["marina", "boat", "dock", "harbor", "waterfront"],
  bars: ["bar", "rooftop", "cocktail", "drinks", "evening"],
  museums: ["museum", "art", "culture", "exhibition", "indoor"],
  parks: ["park", "green", "walk", "outdoor", "outside"],
  "local-services": ["service", "rental", "bike", "information", "cruise"],
};

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "at",
  "best",
  "can",
  "do",
  "find",
  "for",
  "i",
  "in",
  "is",
  "me",
  "near",
  "nearby",
  "of",
  "on",
  "or",
  "please",
  "show",
  "the",
  "thing",
  "things",
  "to",
  "today",
  "what",
  "where",
  "with",
]);

const termExpansions: Record<string, string[]> = {
  accommodation: ["accommodation", "hotel", "stay"],
  bar: ["bar", "drinks", "cocktail", "evening"],
  bars: ["bar", "drinks", "cocktail", "evening"],
  bike: ["bike", "rental", "transport"],
  cafe: ["cafe", "coffee"],
  cafes: ["cafe", "coffee"],
  coffee: ["coffee", "cafe"],
  dinner: ["dinner", "restaurant", "food"],
  food: ["food", "restaurant", "market", "tasting"],
  hotel: ["hotel", "stay", "lobby", "accommodation"],
  hotels: ["hotel", "stay", "lobby", "accommodation"],
  marina: ["marina", "boats", "dock", "harbor"],
  marinas: ["marina", "boats", "dock", "harbor"],
  museum: ["museum", "art", "culture", "exhibition"],
  museums: ["museum", "art", "culture", "exhibition"],
  park: ["park", "green", "walk", "outdoors"],
  parks: ["park", "green", "walk", "outdoors"],
  restaurant: ["restaurant", "dinner", "food", "meal"],
  restaurants: ["restaurant", "dinner", "food", "meal"],
  rooftop: ["rooftop", "roof", "view", "bar"],
  rooftops: ["rooftop", "roof", "view", "bar"],
  shopping: ["shopping", "shop", "market", "gifts"],
  wifi: ["wifi", "internet", "laptop", "work"],
};

export type RecommendationResult = {
  query: string;
  detectedCategory: PlaceCategory | null;
  detectedLocation: string | null;
  places: Place[];
};

function normalizeSearchText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/wi[\s-]?fi/g, "wifi")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function singularize(term: string) {
  if (term.endsWith("ies") && term.length > 4) {
    return `${term.slice(0, -3)}y`;
  }

  if (term.endsWith("s") && term.length > 3) {
    return term.slice(0, -1);
  }

  return term;
}

function locationTerms() {
  return new Set(
    cities.flatMap((city) => [
      city.slug,
      ...normalizeSearchText(city.name).split(" "),
      ...normalizeSearchText(city.country).split(" "),
    ]),
  );
}

function queryTerms(query: string) {
  const cityTerms = locationTerms();
  const normalized = normalizeSearchText(query);
  const terms = normalized
    .split(" ")
    .map(singularize)
    .filter((term) => term.length > 1 && !stopWords.has(term) && !cityTerms.has(term));

  return Array.from(new Set(terms));
}

function expandedTerms(query: string) {
  return Array.from(
    new Set(
      queryTerms(query).flatMap((term) => [
        term,
        singularize(term),
        ...(termExpansions[term] ?? []),
      ]),
    ),
  );
}

export function detectCategory(query: string): PlaceCategory | null {
  const normalized = normalizeSearchText(query);

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => normalized.includes(normalizeSearchText(keyword)))) {
      return category as PlaceCategory;
    }
  }

  return null;
}

export function detectLocation(query: string) {
  return getCityBySearchTerm(query)?.slug ?? null;
}

function broadIntentCategories(query: string): PlaceCategory[] {
  const normalized = normalizeSearchText(query);

  if (
    normalized.includes("things to do") ||
    normalized.includes("what to do") ||
    normalized.includes("experience") ||
    normalized.includes("experiences")
  ) {
    return ["attractions", "activities", "parks", "museums", "local-services"];
  }

  return [];
}

function includesTerm(text: string, term: string) {
  if (term.includes(" ")) {
    return text.includes(term);
  }

  return text
    .split(" ")
    .some((word) => word === term || singularize(word) === term || word === singularize(term));
}

function scoreField(text: string, terms: string[], points: number) {
  return terms.reduce((score, term) => score + (includesTerm(text, term) ? points : 0), 0);
}

function scorePlace(place: Place, query: string, category: PlaceCategory | null) {
  const terms = expandedTerms(query);
  const broadCategories = broadIntentCategories(query);
  const fields = {
    name: normalizeSearchText(place.name),
    category: normalizeSearchText(place.category),
    description: normalizeSearchText(place.description),
    shortDescription: normalizeSearchText(place.shortDescription),
    tags: normalizeSearchText(place.tags.join(" ")),
  };

  let matchScore = 0;
  matchScore += scoreField(fields.tags, terms, 45);
  matchScore += scoreField(fields.name, terms, 35);
  matchScore += scoreField(fields.category, terms, 32);
  matchScore += scoreField(fields.shortDescription, terms, 24);
  matchScore += scoreField(fields.description, terms, 16);

  if (category && place.category === category) {
    matchScore += 36;
  }

  if (broadCategories.includes(place.category)) {
    matchScore += 26;
  }

  if (matchScore === 0) {
    return 0;
  }

  const sponsoredBoost = place.isSponsored ? Math.min(place.sponsoredPriority, 4) : 0;
  const ratingBoost = place.rating ? Math.round(place.rating) : 0;

  return matchScore + sponsoredBoost + ratingBoost;
}

export function recommendPlaces(query: string): RecommendationResult {
  const trimmedQuery = query.trim();
  const detectedCategory = detectCategory(trimmedQuery);
  const detectedLocation = detectLocation(trimmedQuery);
  const detectedCity = getCityBySearchTerm(detectedLocation);
  const normalizedLocation = detectedCity ? normalizeLocation(detectedCity.name) : null;
  const hasSearchIntent =
    expandedTerms(trimmedQuery).length > 0 ||
    Boolean(detectedCategory) ||
    broadIntentCategories(trimmedQuery).length > 0;

  const ranked = activePlaces
    .filter((place) => {
      const locationMatches =
        !normalizedLocation ||
        normalizeLocation(place.city) === normalizedLocation ||
        normalizeLocation(place.country) === normalizedLocation;

      return locationMatches;
    })
    .map((place) => ({ place, score: scorePlace(place, trimmedQuery, detectedCategory) }))
    .filter(({ score }) => score > 0 || !trimmedQuery || (detectedLocation && !hasSearchIntent))
    .sort((a, b) => b.score - a.score || b.place.sponsoredPriority - a.place.sponsoredPriority)
    .map(({ place }) => place);

  // TODO: Insert OpenAI API ranking here. The future agent can parse intent,
  // infer nuanced needs, and re-rank the deterministic candidate set above.
  return {
    query: trimmedQuery,
    detectedCategory,
    detectedLocation,
    places: ranked,
  };
}
