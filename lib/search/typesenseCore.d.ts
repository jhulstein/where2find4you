import type { City, Place } from "../types";
import type { SearchFilterId } from "../searchFilters";

export const TYPESENSE_PLACES_COLLECTION: string;

export type TypesensePlaceDocument = {
  id: string;
  recordId: string;
  name: string;
  normalizedName: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: Place["category"];
  normalizedCategory: string;
  categoryAliases: string[];
  tags: string[];
  normalizedTags: string[];
  amenities: string[];
  normalizedAmenities: string[];
  features: string[];
  normalizedFeatures: string[];
  searchText: string;
  address: string;
  city: string;
  country: string;
  location: [number, number];
  latitude: number;
  longitude: number;
  hasWifi: boolean;
  freeWifi: boolean;
  publicWifi: boolean;
  rating: number;
  popularity: number;
  verified: boolean;
  openNow: boolean;
  isSponsored: boolean;
  sponsoredPriority: number;
  isActive: boolean;
  openingHours: string;
  websiteUrl: string | null;
  phone: string | null;
  email: string | null;
  imageUrl: string | null;
  source: Place["source"];
  sourceId: string | null;
  createdAt: string;
  updatedAtIso: string;
  updatedAt: number;
};

export type TypesenseSearchBuildInput = {
  category?: SearchFilterId | string | null;
  debug?: boolean;
  limit?: number;
  location?: City | null;
  offset?: number;
  page?: number | null;
  pageSize?: number;
  query?: string | null;
  radiusKm?: number | null;
  sort?: string | null;
  userLocation?: { latitude: number; longitude: number } | null;
};

export const typesensePlacesSchema: {
  name: string;
  fields: Array<Record<string, string | boolean>>;
  default_sorting_field: string;
};

export const typesenseSynonyms: Array<{
  id: string;
  synonyms: string[];
}>;

export function getCategoryAliases(category: string): string[];

export function createTypesensePlaceDocument(
  place: Place,
  options?: { popularity?: number },
): TypesensePlaceDocument;

export function placeFromTypesenseDocument(document: Partial<TypesensePlaceDocument>): Place;

export function buildTypesenseSearchParameters(
  input?: TypesenseSearchBuildInput,
): Record<string, string>;
