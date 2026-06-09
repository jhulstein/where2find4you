import { activePlaces } from "@/lib/data/places";
import { insertSupabaseRows } from "@/lib/supabase/server";
import type {
  ClickType,
  PlaceClick,
  PlaceImpression,
  PlaceView,
  SearchRecord,
} from "@/lib/types";

const createdAt = "2026-06-08T10:00:00.000Z";

export const searches: SearchRecord[] = [
  {
    id: "search-001",
    query: "romantic restaurant near the waterfront",
    detectedCategory: "restaurants",
    detectedLocation: "oslo",
    userCity: null,
    userCountry: null,
    sessionId: "seed-session-1",
    createdAt,
  },
  {
    id: "search-002",
    query: "quiet cafe with wifi",
    detectedCategory: "cafes",
    detectedLocation: "oslo",
    userCity: null,
    userCountry: null,
    sessionId: "seed-session-2",
    createdAt,
  },
  {
    id: "search-003",
    query: "marina with nearby restaurants",
    detectedCategory: "marinas",
    detectedLocation: "miami",
    userCity: null,
    userCountry: null,
    sessionId: "seed-session-3",
    createdAt,
  },
  {
    id: "search-004",
    query: "family activities in Oslo",
    detectedCategory: "activities",
    detectedLocation: "oslo",
    userCity: null,
    userCountry: null,
    sessionId: "seed-session-4",
    createdAt,
  },
];

export const placeImpressions: PlaceImpression[] = activePlaces.flatMap((place, index) =>
  Array.from({ length: Math.max(3, 24 - index) }, (_, itemIndex) => ({
    id: `imp-${place.id}-${itemIndex}`,
    placeId: place.id,
    searchId: searches[itemIndex % searches.length]?.id ?? null,
    sessionId: `seed-session-${itemIndex % 6}`,
    resultPosition: (itemIndex % 10) + 1,
    isSponsored: place.isSponsored,
    createdAt,
  })),
);

export const placeClicks: PlaceClick[] = activePlaces.flatMap((place, index) =>
  Array.from({ length: Math.max(1, Math.round((20 - index) / 3)) }, (_, itemIndex) => ({
    id: `click-${place.id}-${itemIndex}`,
    placeId: place.id,
    searchId: searches[itemIndex % searches.length]?.id ?? null,
    sessionId: `seed-session-${itemIndex % 6}`,
    clickType: itemIndex % 2 === 0 ? "profile" : "website",
    createdAt,
  })),
);

export const placeViews: PlaceView[] = activePlaces.flatMap((place, index) =>
  Array.from({ length: Math.max(1, Math.round((18 - index) / 4)) }, (_, itemIndex) => ({
    id: `view-${place.id}-${itemIndex}`,
    placeId: place.id,
    searchId: searches[itemIndex % searches.length]?.id ?? null,
    sessionId: `seed-session-${itemIndex % 6}`,
    createdAt,
  })),
);

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function createSearchRecord(input: {
  query: string;
  detectedCategory: SearchRecord["detectedCategory"];
  detectedLocation: string | null;
  sessionId?: string;
}) {
  const record: SearchRecord = {
    id: id("search"),
    query: input.query,
    detectedCategory: input.detectedCategory,
    detectedLocation: input.detectedLocation,
    userCity: null,
    userCountry: null,
    sessionId: input.sessionId ?? "anonymous-session",
    createdAt: new Date().toISOString(),
  };
  searches.unshift(record);
  await persistSearch(record);
  return record;
}

export async function logImpressions(input: {
  places: Array<{ id: string; isSponsored: boolean }>;
  searchId: string | null;
  sessionId?: string;
}) {
  const records = input.places.map((place, index) => ({
    id: id("imp"),
    placeId: place.id,
    searchId: input.searchId,
    sessionId: input.sessionId ?? "anonymous-session",
    resultPosition: index + 1,
    isSponsored: place.isSponsored,
    createdAt: new Date().toISOString(),
  }));
  placeImpressions.unshift(...records);
  await persistImpressions(records);
  return records;
}

export async function logClick(input: {
  placeId: string;
  searchId?: string | null;
  sessionId?: string;
  clickType: ClickType;
}) {
  const record: PlaceClick = {
    id: id("click"),
    placeId: input.placeId,
    searchId: input.searchId ?? null,
    sessionId: input.sessionId ?? "anonymous-session",
    clickType: input.clickType,
    createdAt: new Date().toISOString(),
  };
  placeClicks.unshift(record);
  await persistClick(record);
  return record;
}

export async function logView(input: {
  placeId: string;
  searchId?: string | null;
  sessionId?: string;
}) {
  const record: PlaceView = {
    id: id("view"),
    placeId: input.placeId,
    searchId: input.searchId ?? null,
    sessionId: input.sessionId ?? "anonymous-session",
    createdAt: new Date().toISOString(),
  };
  placeViews.unshift(record);
  await persistView(record);
  return record;
}

async function persistSearch(record: SearchRecord) {
  await insertSupabaseRows("searches", [
    {
      id: record.id,
      query: record.query,
      detected_category: record.detectedCategory,
      detected_location: record.detectedLocation,
      user_city: record.userCity,
      user_country: record.userCountry,
      session_id: record.sessionId,
      created_at: record.createdAt,
    },
  ]);
}

async function persistImpressions(records: PlaceImpression[]) {
  await insertSupabaseRows(
    "place_impressions",
    records.map((record) => ({
      id: record.id,
      place_id: record.placeId,
      search_id: record.searchId,
      session_id: record.sessionId,
      result_position: record.resultPosition,
      is_sponsored: record.isSponsored,
      created_at: record.createdAt,
    })),
  );
}

async function persistClick(record: PlaceClick) {
  await insertSupabaseRows("place_clicks", [
    {
      id: record.id,
      place_id: record.placeId,
      search_id: record.searchId,
      session_id: record.sessionId,
      click_type: record.clickType,
      created_at: record.createdAt,
    },
  ]);
}

async function persistView(record: PlaceView) {
  await insertSupabaseRows("place_views", [
    {
      id: record.id,
      place_id: record.placeId,
      search_id: record.searchId,
      session_id: record.sessionId,
      created_at: record.createdAt,
    },
  ]);
}
