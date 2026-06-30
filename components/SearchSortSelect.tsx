"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";

type SearchSortSelectProps = {
  category: string;
  filters: string[];
  latitude?: number | null;
  location?: string | null;
  longitude?: number | null;
  sort: string;
};

export function SearchSortSelect({
  category,
  filters,
  latitude = null,
  location = null,
  longitude = null,
  sort,
}: SearchSortSelectProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  function hrefFor(nextSort: string) {
    const searchParams = new URLSearchParams();

    searchParams.set("category", category);
    for (const filter of filters) {
      searchParams.append("filter", filter);
    }
    if (location) {
      searchParams.set("location", location);
    } else if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      searchParams.set("lat", String(latitude));
      searchParams.set("lon", String(longitude));
    }
    searchParams.set("sort", nextSort);

    return `/search?${searchParams.toString()}`;
  }

  function changeSort(nextSort: string) {
    setIsLoading(true);
    router.push(hrefFor(nextSort));
  }

  return (
    <div className="relative">
      <select
        name="sort"
        value={sort}
        onChange={(event) => changeSort(event.target.value)}
        disabled={isLoading}
        className="h-11 w-full rounded-lg border border-slate-200 px-3 pr-10 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100 disabled:cursor-wait disabled:opacity-70"
      >
        <option value="relevance">Sort by relevance</option>
        <option value="popularity">Sort by popularity</option>
        <option value="newest">Sort by newest</option>
      </select>
      {isLoading ? (
        <span className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded bg-white pl-1 text-xs font-semibold text-teal-700">
          <LoaderCircle aria-hidden="true" size={14} className="animate-spin" />
          Loading...
        </span>
      ) : null}
    </div>
  );
}
