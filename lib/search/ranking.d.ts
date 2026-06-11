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

export function normalizeQuery(value?: string): string;

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
    userLocation?: SearchCoordinates | null;
  },
): RankedPlace[];
