import type { City, Place } from "../types";
import type { SearchFilterId } from "./searchFilters";

export type SearchCoordinates = {
  latitude: number;
  longitude: number;
};

export type RankedPlace = {
  distanceKm: number;
  distanceScore: number;
  freshnessScore: number;
  index: number;
  isRelevant: boolean;
  matchTier: number;
  matchedTerms: number;
  place: Place;
  popularityScore: number;
  qualityScore: number;
  score: number;
  textScore: number;
  tier: number;
  verifiedScore: number;
};

export type SearchIntentResult = {
  detectedCategory: Place["category"] | null;
  hasCafeIntent: boolean;
  hasFreeWifiIntent: boolean;
  hasWifiIntent: boolean;
  intents: string[];
  normalizedQuery: string;
};

export const searchIntents: Record<string, {
  category?: Place["category"];
  phrases: string[];
  terms: string[];
}>;

export const DEFAULT_SEARCH_RADIUS_KM: number;

export function normalizeQuery(value?: string): string;

export function distanceKm(
  first: SearchCoordinates | null | undefined,
  second: SearchCoordinates | null | undefined,
): number | null;

export function singularizeSearchTerm(term: string): string;

export function detectSearchIntent(query: string): SearchIntentResult;

export function matchesSearchIntent(place: Place, intentId: string): boolean;

export function placeMatchesFilterId(place: Place, filter?: string): boolean;

export function queryTerms(
  query: string,
  options?: { location?: City | null },
): string[];

export function compareRankedPlaces(first: RankedPlace, second: RankedPlace): number;

export function rankPlaces(
  places: Place[],
  options?: {
    category?: SearchFilterId | null;
    location?: City | null;
    query?: string;
    getPopularityScore?: (place: Place) => number;
    maxRadiusKm?: number;
    userLocation?: SearchCoordinates | null;
  },
): RankedPlace[];

export function searchPlaceRecords(
  places: Place[],
  options?: {
    category?: SearchFilterId | string | null;
    location?: City | null;
    query?: string;
    getPopularityScore?: (place: Place) => number;
    maxRadiusKm?: number;
    userLocation?: SearchCoordinates | null;
    sort?: "relevance" | "popularity" | "newest" | string | null;
    offset?: number;
    limit?: number;
  },
): {
  limit: number;
  normalizedQuery: string;
  offset: number;
  ranked: RankedPlace[];
  results: Place[];
  totalCount: number;
};
