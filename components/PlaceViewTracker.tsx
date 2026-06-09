"use client";

import { useEffect } from "react";
import { sendTrackingEvent } from "@/components/clientTracking";

type PlaceViewTrackerProps = {
  placeId: string;
  searchId?: string | null;
};

export function PlaceViewTracker({ placeId, searchId }: PlaceViewTrackerProps) {
  useEffect(() => {
    sendTrackingEvent("/api/track/view", { placeId, searchId });
  }, [placeId, searchId]);

  return null;
}
