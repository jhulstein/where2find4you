"use client";

import { useMemo, useState } from "react";
import { FilterBar, type FilterId } from "@/components/FilterBar";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceMap } from "@/components/PlaceMap";
import type { City, Place, PlaceScore } from "@/lib/types";

type CityExplorerProps = {
  city: City;
  places: Place[];
  scores: PlaceScore[];
};

function matchesFilter(place: Place, score: PlaceScore, filter: FilterId) {
  if (filter === "high-score") {
    return score.totalScore >= 86;
  }

  return place.tags.includes(filter);
}

export function CityExplorer({ city, places, scores }: CityExplorerProps) {
  const [activeFilters, setActiveFilters] = useState<FilterId[]>([
    "free-wifi",
    "laptop-friendly",
  ]);

  const scoresByPlaceId = useMemo(
    () =>
      scores.reduce<Record<string, PlaceScore>>((accumulator, score) => {
        accumulator[score.placeId] = score;
        return accumulator;
      }, {}),
    [scores],
  );

  const filteredPlaces = places.filter((place) =>
    activeFilters.every((filter) =>
      matchesFilter(place, scoresByPlaceId[place.id], filter),
    ),
  );

  function handleToggle(filter: FilterId) {
    setActiveFilters((current) =>
      current.includes(filter)
        ? current.filter((item) => item !== filter)
        : [...current, filter],
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1.05fr)]">
      <section className="min-w-0">
        <div className="mb-4 rounded-lg border border-stone-200 bg-white p-4">
          <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-semibold text-stone-950">Filters</h2>
            <p className="text-sm text-stone-500">
              {filteredPlaces.length} of {places.length} places
            </p>
          </div>
          <FilterBar activeFilters={activeFilters} onToggle={handleToggle} />
        </div>

        <div className="space-y-3">
          {filteredPlaces.length > 0 ? (
            filteredPlaces.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                score={scoresByPlaceId[place.id]}
              />
            ))
          ) : (
            <div className="rounded-lg border border-stone-200 bg-white p-8 text-center">
              <p className="font-semibold text-stone-950">No matches yet</p>
              <p className="mt-2 text-sm text-stone-600">
                Try removing one filter to broaden the Oslo seed set.
              </p>
            </div>
          )}
        </div>
      </section>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <PlaceMap
          city={city}
          places={filteredPlaces}
          scores={filteredPlaces.map((place) => scoresByPlaceId[place.id])}
          heightClassName="h-[460px] lg:h-[680px]"
        />
      </aside>
    </div>
  );
}
