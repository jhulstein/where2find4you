"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { searchFilterOptions, type SearchFilterId } from "@/lib/searchFilters";

type CategoryFilterProps = {
  activeCategory?: SearchFilterId;
  activeFilters?: string[];
  latitude?: number | null;
  location?: string;
  longitude?: number | null;
  sort?: string;
};

export function CategoryFilter({
  activeCategory = "all",
  activeFilters = [],
  latitude = null,
  location,
  longitude = null,
  sort = "relevance",
}: CategoryFilterProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<SearchFilterId | null>(null);

  function currentHref() {
    return `${window.location.pathname}${window.location.search}`;
  }

  function hrefFor(optionId: SearchFilterId) {
    const searchParams = new URLSearchParams();
    const hasUserLocation = Number.isFinite(latitude) && Number.isFinite(longitude);
    const isFreeWifiFilter = optionId === "free-wifi";
    const categoryId = isFreeWifiFilter ? activeCategory : optionId;
    const nextLocation = hasUserLocation
      ? undefined
      : location ?? (categoryId === "all" ? undefined : "oslo");
    const nextFilters = new Set(activeFilters);

    if (isFreeWifiFilter) {
      if (nextFilters.has("free_wifi")) {
        nextFilters.delete("free_wifi");
      } else {
        nextFilters.add("free_wifi");
      }
    }
    if (nextLocation) {
      searchParams.set("location", nextLocation);
    }
    if (hasUserLocation) {
      searchParams.set("lat", String(latitude));
      searchParams.set("lon", String(longitude));
    }
    searchParams.set("category", categoryId);
    for (const filter of nextFilters) {
      searchParams.append("filter", filter);
    }
    searchParams.set("sort", sort);

    return `/search?${searchParams.toString()}`;
  }

  function navigate(optionId: SearchFilterId) {
    const href = hrefFor(optionId);

    if (href === currentHref()) {
      return;
    }

    setPendingId(optionId);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {searchFilterOptions.map((category) => {
        const isLoading = isPending && pendingId === category.id;
        const isActive =
          category.id === "free-wifi"
            ? activeFilters.includes("free_wifi")
            : activeCategory === category.id;

        return (
          <button
            key={category.id}
            type="button"
            onClick={() => navigate(category.id)}
            className={`shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50"
            }`}
          >
            <span className="inline-flex items-center gap-1.5">
              {isLoading ? <LoaderCircle aria-hidden="true" size={14} className="animate-spin" /> : null}
              {category.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
