"use client";

import { useState, useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();
  const [pendingSort, setPendingSort] = useState<string | null>(null);

  function currentHref() {
    return `${window.location.pathname}${window.location.search}`;
  }

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
    const href = hrefFor(nextSort);

    if (href === currentHref()) {
      return;
    }

    setPendingSort(nextSort);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <div className="relative">
      <select
        name="sort"
        value={sort}
        onChange={(event) => changeSort(event.target.value)}
        className="h-11 w-full rounded-lg border border-slate-200 px-3 pr-10 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
      >
        <option value="relevance">Sort by relevance</option>
        <option value="popularity">Sort by popularity</option>
        <option value="newest">Sort by newest</option>
      </select>
      {isPending && pendingSort ? (
        <span className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center rounded bg-white pl-1 text-teal-700">
          <LoaderCircle aria-hidden="true" size={14} className="animate-spin" />
          <span className="sr-only">Sorting results</span>
        </span>
      ) : null}
    </div>
  );
}
