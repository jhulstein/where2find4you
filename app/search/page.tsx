import Link from "next/link";
import { HeartHandshake, MapPin, SlidersHorizontal } from "lucide-react";
import { CategoryFilter } from "@/components/CategoryFilter";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceMap } from "@/components/PlaceMap";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { SearchBar } from "@/components/SearchBar";
import { getPlaceAnalytics } from "@/lib/analytics";
import { cities, getCityBySearchTerm, normalizeLocation } from "@/lib/data/cities";
import { activePlaces } from "@/lib/data/places";
import { recommendPlaces } from "@/lib/ai/recommendPlaces";
import { searchOsmPlaces } from "@/lib/search/osmPlaces";
import {
  matchesSearchFilter,
  normalizeSearchFilter,
  searchFilterOptions,
} from "@/lib/searchFilters";
import { createSearchRecord, logImpressions } from "@/lib/tracking";
import type { Place } from "@/lib/types";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    location?: string;
    sort?: "relevance" | "popularity" | "newest";
  }>;
};

function placeMergeKey(place: Place) {
  return [
    place.name.trim().toLowerCase(),
    place.city.trim().toLowerCase(),
    place.latitude.toFixed(4),
    place.longitude.toFixed(4),
  ].join("-");
}

function mergePlaces(...placeGroups: Place[][]) {
  const seen = new Set<string>();

  return placeGroups.flat().filter((place) => {
    const key = placeMergeKey(place);

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q ?? "";
  const category = normalizeSearchFilter(params.category);
  const sort = params.sort ?? "relevance";
  const recommendation = query ? recommendPlaces(query) : { ...recommendPlaces(""), places: activePlaces };
  const selectedCity =
    getCityBySearchTerm(params.location) ??
    getCityBySearchTerm(query) ??
    getCityBySearchTerm(recommendation.detectedLocation);
  const defaultFilterCity = category !== "all" ? cities[0] : null;
  const cityForSearch =
    selectedCity ?? getCityBySearchTerm(recommendation.detectedLocation) ?? defaultFilterCity;
  const shouldFetchOsmPlaces = Boolean(cityForSearch && (query.trim() || category !== "all"));
  const osmPlaces = shouldFetchOsmPlaces
    ? await searchOsmPlaces({
        category,
        city: cityForSearch,
        detectedCategory: recommendation.detectedCategory,
        limit: 36,
        query,
      })
    : [];
  const staticBasePlaces = category === "all" ? recommendation.places : activePlaces;
  const basePlaces = mergePlaces(staticBasePlaces, osmPlaces);
  const filtered = basePlaces.filter((place) => {
    const locationMatches =
      !cityForSearch ||
      normalizeLocation(place.city) === normalizeLocation(cityForSearch.name) ||
      normalizeLocation(place.country) === normalizeLocation(cityForSearch.country);
    return matchesSearchFilter(place, category) && locationMatches;
  });
  const relevanceRank = new Map(
    recommendation.places.map((place, index) => [place.id, index]),
  );
  const sorted = [...filtered].sort((a, b) => {
    if (sort === "popularity") {
      return getPlaceAnalytics(b).impressions - getPlaceAnalytics(a).impressions;
    }
    if (sort === "newest") {
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    }

    if (query) {
      const aRank = relevanceRank.get(a.id) ?? Number.MAX_SAFE_INTEGER;
      const bRank = relevanceRank.get(b.id) ?? Number.MAX_SAFE_INTEGER;

      if (aRank !== bRank) {
        return aRank - bRank;
      }
    }

    return b.sponsoredPriority - a.sponsoredPriority;
  });
  const searchRecord = await createSearchRecord({
    query: query || "all places",
    detectedCategory: recommendation.detectedCategory,
    detectedLocation: recommendation.detectedLocation,
  });
  await logImpressions({
    places: sorted.map((place) => ({ id: place.id, isSponsored: place.isSponsored })),
    searchId: searchRecord.id,
  });
  const mapPlaces = sorted.slice(0, 20);
  const cityLabel = cityForSearch
    ? `${cityForSearch.name}, ${cityForSearch.country}`
    : "All pilot cities";
  const activeFilter = searchFilterOptions.find((option) => option.id === category);
  const pageTitle = query
    ? `Results for “${query}”`
    : category === "all"
      ? "Explore places"
      : `${activeFilter?.label ?? "Places"} in ${cityForSearch?.name ?? "pilot cities"}`;
  const donationUrl = process.env.NEXT_PUBLIC_DONATION_URL ?? "/contact?reason=donation";
  const donationIsExternal = donationUrl.startsWith("http");

  return (
    <main>
      <ResponsiveContainer className="py-6 sm:py-8">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <SearchBar
            defaultValue={query}
            compact
            location={cityForSearch?.slug ?? params.location}
            sort={sort}
          />
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
            <CategoryFilter
              activeCategory={category}
              location={cityForSearch?.slug ?? params.location}
              query={query}
              sort={sort}
            />
            <form action="/search" className="flex gap-2">
              <input type="hidden" name="q" value={query} />
              <input type="hidden" name="category" value={category} />
              <input type="hidden" name="sort" value={sort} />
              <input
                name="location"
                defaultValue={cityForSearch?.name ?? params.location}
                placeholder="City"
                className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
              <button className="h-11 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white">
                Go
              </button>
            </form>
            <form action="/search">
              <input type="hidden" name="q" value={query} />
              <input type="hidden" name="category" value={category} />
              {cityForSearch ? (
                <input type="hidden" name="location" value={cityForSearch.slug} />
              ) : null}
              <select
                name="sort"
                defaultValue={sort}
                className="h-11 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              >
                <option value="relevance">Sort by relevance</option>
                <option value="popularity">Sort by popularity</option>
                <option value="newest">Sort by newest</option>
              </select>
            </form>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {cities.slice(0, 6).map((city) => (
              <Link
                key={city.id}
                href={`/search?q=${encodeURIComponent(query || `things to do in ${city.name}`)}&location=${city.slug}&category=${category}&sort=${sort}`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  cityForSearch?.id === city.id
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50"
                }`}
              >
                <MapPin aria-hidden="true" size={14} />
                {city.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-end">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
              {pageTitle}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              City: <span className="font-semibold text-slate-800">{cityLabel}</span>.
              {" "}
              {sorted.length} matching places. Sponsored listings are clearly marked.
            </p>
          </div>
          <a
            href={donationUrl}
            target={donationIsExternal ? "_blank" : undefined}
            rel={donationIsExternal ? "noreferrer" : undefined}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
          >
            <HeartHandshake aria-hidden="true" size={18} />
            Free for users. Donate.
          </a>
        </div>

        <PlaceMap
          places={mapPlaces}
          city={cityForSearch ?? undefined}
          preferUserLocation
          showLocationControl
          title="Map view"
          subtitle={
            cityForSearch
              ? `Use your position when available, or browse ${cityForSearch.name}. ${mapPlaces.length} places shown.`
              : `Use your position when available. ${mapPlaces.length} matching places shown across pilot cities.`
          }
          heightClassName="h-[420px] sm:h-[520px] lg:h-[620px]"
        />

        <div className="mt-6 mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-slate-950">Places found</h2>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">
            <SlidersHorizontal aria-hidden="true" size={16} />
            Results update with your filters
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {sorted.map((place) => (
            <PlaceCard key={place.id} place={place} analytics={getPlaceAnalytics(place)} />
          ))}
        </div>
        {sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <h2 className="text-lg font-semibold text-slate-950">No strong matches yet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Try a broader search, choose Oslo, or use one of the category buttons above.
              The public POC currently searches the places that have been added to the demo database.
            </p>
          </div>
        ) : null}
      </ResponsiveContainer>
    </main>
  );
}
