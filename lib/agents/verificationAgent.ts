import type { PlaceScore } from "@/lib/types";

export async function verifyPlaceSignals(
  placeId: string,
): Promise<Partial<PlaceScore>> {
  // TODO: Schedule verification jobs that re-check opening hours, WiFi claims, and source freshness.
  return {
    placeId,
    confidenceScore: 70,
  };
}
