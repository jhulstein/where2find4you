"use client";

import dynamic from "next/dynamic";
import type { City, Place, PlaceScore } from "@/lib/types";

export type PlaceMapProps = {
  places: Place[];
  city?: City;
  scores?: PlaceScore[];
  heightClassName?: string;
  initialUserLocation?: { latitude: number; longitude: number } | null;
  preferUserLocation?: boolean;
  showLocationControl?: boolean;
  title?: string;
  subtitle?: string;
  updateSearchOnLocate?: boolean;
};

const LeafletMap = dynamic(() => import("@/components/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-sm text-slate-500">
      Loading map
    </div>
  ),
});

export function PlaceMap({
  places,
  city,
  scores = [],
  heightClassName = "h-[420px]",
  initialUserLocation = null,
  preferUserLocation = false,
  showLocationControl = false,
  title,
  subtitle,
  updateSearchOnLocate = false,
}: PlaceMapProps) {
  const mapKey = initialUserLocation
    ? `user-${initialUserLocation.latitude}-${initialUserLocation.longitude}`
    : `city-${city?.id ?? "all"}`;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {title ? (
        <div className="border-b border-slate-200 px-4 py-3">
          <h2 className="font-semibold text-slate-950">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">
            {subtitle ?? `${places.length} places shown with OpenStreetMap tiles.`}
          </p>
        </div>
      ) : null}
      <div className={heightClassName}>
        <LeafletMap
          city={city}
          key={mapKey}
          initialUserLocation={initialUserLocation}
          places={places}
          preferUserLocation={preferUserLocation}
          scores={scores}
          showLocationControl={showLocationControl}
          updateSearchOnLocate={updateSearchOnLocate}
        />
      </div>
    </section>
  );
}
