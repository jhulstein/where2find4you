"use client";

import dynamic from "next/dynamic";
import type { City, Place, PlaceScore } from "@/lib/types";

export type PlaceMapProps = {
  city: City;
  places: Place[];
  scores: PlaceScore[];
  heightClassName?: string;
};

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-lg border border-stone-200 bg-stone-100 text-sm text-stone-500">
      Loading map
    </div>
  ),
});

export function PlaceMap({
  city,
  places,
  scores,
  heightClassName = "h-[420px]",
}: PlaceMapProps) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm ${heightClassName}`}
    >
      <LeafletMap city={city} places={places} scores={scores} />
    </div>
  );
}
