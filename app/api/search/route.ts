import { NextResponse } from "next/server";
import { recommendPlaces } from "@/lib/ai/recommendPlaces";
import { createSearchRecord, logImpressions } from "@/lib/tracking";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  const result = recommendPlaces(query);
  const search = await createSearchRecord({
    query: query || "all places",
    detectedCategory: result.detectedCategory,
    detectedLocation: result.detectedLocation,
    sessionId: request.headers.get("x-session-id") ?? undefined,
  });
  const impressions = await logImpressions({
    places: result.places.map((place) => ({ id: place.id, isSponsored: place.isSponsored })),
    searchId: search.id,
    sessionId: search.sessionId,
  });

  return NextResponse.json({ search, impressions, results: result.places });
}
