import { callSupabaseRpc } from "@/lib/supabase/server";
import type { City, Place, PlaceCategory } from "@/lib/types";
import type { SearchFilterId } from "@/lib/searchFilters";

type SearchPlacesRow = {
  id: string;
  name: string;
  slug: string;
  category: PlaceCategory;
  description: string;
  short_description: string;
  address: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  website_url: string | null;
  phone: string | null;
  email: string | null;
  image_url: string | null;
  source: Place["source"];
  source_id: string | null;
  tags: string[] | null;
  is_sponsored: boolean;
  sponsored_priority: number;
  is_active: boolean;
  rating: number | string | null;
  opening_hours: string | null;
  created_at: string;
  updated_at: string;
  distance_meters: number | null;
  text_score: number;
  distance_score: number;
  match_tier: number;
  popularity_score: number;
  verified_score: number;
  freshness_score: number;
  relevance_score: number;
  total_count: number;
};

export type SupabasePlaceSearchResult = {
  places: Place[];
  totalCount: number;
};

function numberValue(value: number | string | null, fallback: number | null = null) {
  if (value === null) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function rowToPlace(row: SearchPlacesRow): Place {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    category: row.category,
    description: row.description,
    shortDescription: row.short_description,
    address: row.address ?? "",
    city: row.city ?? "",
    country: row.country ?? "",
    latitude: row.latitude ?? 0,
    longitude: row.longitude ?? 0,
    websiteUrl: row.website_url,
    phone: row.phone,
    email: row.email,
    imageUrl: row.image_url,
    source: row.source,
    sourceId: row.source_id,
    tags: row.tags ?? [],
    isSponsored: row.is_sponsored,
    sponsoredPriority: row.sponsored_priority,
    isActive: row.is_active,
    rating: numberValue(row.rating),
    openingHours: row.opening_hours ?? "Hours not provided",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function searchSupabasePlaces(input: {
  category: SearchFilterId;
  limit?: number;
  location?: City | null;
  offset?: number;
  query: string;
  userLocation?: { latitude: number; longitude: number } | null;
}): Promise<SupabasePlaceSearchResult | null> {
  const searchLocation = input.userLocation ?? input.location ?? null;
  const response = await callSupabaseRpc<SearchPlacesRow[]>("search_places", {
    filter_category: input.category,
    result_limit: input.limit ?? 50,
    result_offset: input.offset ?? 0,
    search_lat: searchLocation?.latitude,
    search_lon: searchLocation?.longitude,
    search_query: input.query,
  });

  if (!response.ok || !response.data) {
    return null;
  }

  return {
    places: response.data.map(rowToPlace),
    totalCount: response.data[0]?.total_count ?? 0,
  };
}
