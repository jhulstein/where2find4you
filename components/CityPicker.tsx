"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, MapPin } from "lucide-react";
import type { City } from "@/lib/types";

type CityPickerProps = {
  activeCitySlug?: string | null;
  category: string;
  cities: City[];
  filters: string[];
  popularCities: City[];
  sort: string;
};

export function CityPicker({
  activeCitySlug = null,
  category,
  cities,
  filters,
  popularCities,
  sort,
}: CityPickerProps) {
  const router = useRouter();
  const [loadingCity, setLoadingCity] = useState<string | null>(null);
  const activeCity = cities.find((city) => city.slug === activeCitySlug) ?? null;

  function cityHref(citySlug: string) {
    const searchParams = new URLSearchParams();

    searchParams.set("location", citySlug);
    searchParams.set("category", category);
    for (const filter of filters) {
      searchParams.append("filter", filter);
    }
    searchParams.set("sort", sort);

    return `/search?${searchParams.toString()}`;
  }

  function selectCity(citySlug: string) {
    if (!citySlug) {
      return;
    }

    setLoadingCity(citySlug);
    router.push(cityHref(citySlug));
  }

  return (
    <div className="mt-3 grid gap-3">
      <div className="grid gap-2 sm:max-w-sm">
        <label htmlFor="city-select" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          City
        </label>
        <div className="relative">
          <select
            id="city-select"
            value={activeCity?.slug ?? ""}
            onChange={(event) => selectCity(event.target.value)}
            disabled={loadingCity !== null}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:cursor-wait disabled:opacity-70"
          >
            <option value="" disabled>
              Choose city
            </option>
            {cities.map((city) => (
              <option key={city.id} value={city.slug}>
                {city.name}, {city.country}
              </option>
            ))}
          </select>
          {loadingCity ? (
            <LoaderCircle
              aria-hidden="true"
              size={16}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-teal-700"
            />
          ) : null}
        </div>
        <p className="text-xs text-slate-500">
          Selected: <span className="font-semibold text-slate-700">{activeCity?.name ?? "All pilot cities"}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {popularCities.map((city) => {
          const isActive = activeCity?.id === city.id;
          const isLoading = loadingCity === city.slug;

          return (
            <button
              key={city.id}
              type="button"
              onClick={() => selectCity(city.slug)}
              disabled={loadingCity !== null}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "border-teal-700 bg-teal-700 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50"
              } disabled:cursor-wait disabled:opacity-70`}
            >
              {isLoading ? (
                <LoaderCircle aria-hidden="true" size={14} className="animate-spin" />
              ) : (
                <MapPin aria-hidden="true" size={14} />
              )}
              {isLoading ? "Loading..." : city.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
