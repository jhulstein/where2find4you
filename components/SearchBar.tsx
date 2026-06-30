"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, Search } from "lucide-react";
import { exampleSearches } from "@/lib/data/exampleSearches";
import { normalizeQuery } from "@/lib/search/ranking";

type SearchBarProps = {
  category?: string;
  defaultValue?: string;
  compact?: boolean;
  latitude?: number | null;
  location?: string;
  longitude?: number | null;
  sort?: string;
};

export function SearchBar({
  category,
  defaultValue = "",
  compact = false,
  latitude = null,
  location,
  longitude = null,
  sort,
}: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);
  const [isSearching, setIsSearching] = useState(false);

  function searchPath(searchQuery: string) {
    const trimmed = normalizeQuery(searchQuery);
    const searchParams = new URLSearchParams();

    if (trimmed) {
      searchParams.set("q", trimmed);
    }
    if (location) {
      searchParams.set("location", location);
    }
    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      searchParams.set("lat", String(latitude));
      searchParams.set("lon", String(longitude));
    }
    if (category) {
      searchParams.set("category", category);
    }
    if (sort) {
      searchParams.set("sort", sort);
    }

    const suffix = searchParams.toString();
    return suffix ? `/search?${suffix}` : "/search";
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSearching(true);
    router.push(searchPath(query));
  }

  return (
    <div className="w-full">
      <form
        action="/search"
        onSubmit={submit}
        className={`rounded-xl border border-slate-200 bg-white p-2 shadow-sm ${
          compact ? "" : "sm:p-3"
        }`}
      >
        {location ? <input type="hidden" name="location" value={location} /> : null}
        {Number.isFinite(latitude) && Number.isFinite(longitude) ? (
          <>
            <input type="hidden" name="lat" value={String(latitude)} />
            <input type="hidden" name="lon" value={String(longitude)} />
          </>
        ) : null}
        {category ? <input type="hidden" name="category" value={category} /> : null}
        {sort ? <input type="hidden" name="sort" value={sort} /> : null}
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="global-search">
            Search for places
          </label>
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={20}
            />
            <input
              id="global-search"
              name="q"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="What are you trying to find?"
              className={`w-full rounded-lg border border-slate-200 bg-slate-50 pl-11 pr-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100 ${
                compact ? "h-12" : "h-14 text-base sm:text-lg"
              }`}
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className={`inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 font-semibold text-white transition hover:bg-slate-800 ${
              compact ? "h-12 text-sm" : "h-14 text-base"
            } disabled:cursor-wait disabled:opacity-75`}
          >
            {isSearching ? (
              <>
                <LoaderCircle aria-hidden="true" size={18} className="animate-spin" />
                Loading...
              </>
            ) : (
              <>
                Search
                <ArrowRight aria-hidden="true" size={18} />
              </>
            )}
          </button>
        </div>
      </form>

      {!compact ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {exampleSearches.slice(0, 4).map((example) => (
            <Link
              key={example}
              href={searchPath(example)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-left text-sm text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900"
            >
              {example}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export { SearchBar as SearchBox };
