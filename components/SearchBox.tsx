"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import type { City } from "@/lib/types";

type SearchBoxProps = {
  popularCities: City[];
};

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function SearchBox({ popularCities }: SearchBoxProps) {
  const router = useRouter();
  const [city, setCity] = useState("Oslo");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const slug = toSlug(city);

    if (slug) {
      router.push(`/city/${slug}`);
    }
  }

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-3 shadow-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <label className="sr-only" htmlFor="city-search">
          Search city
        </label>
        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            size={18}
          />
          <input
            id="city-search"
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Search a city"
            className="h-12 w-full rounded-lg border border-stone-200 bg-stone-50 pl-10 pr-3 text-stone-950 outline-none transition placeholder:text-stone-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-100"
          />
        </div>
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          Scout city
          <ArrowRight aria-hidden="true" size={17} />
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {popularCities.map((item) => (
          <Link
            key={item.slug}
            href={`/city/${item.slug}`}
            className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm text-stone-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900"
          >
            {item.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
