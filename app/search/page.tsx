import { HeartHandshake, SlidersHorizontal } from "lucide-react";
import { CategoryFilter } from "@/components/CategoryFilter";
import { CityPicker } from "@/components/CityPicker";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceMap } from "@/components/PlaceMap";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { SearchBar } from "@/components/SearchBar";
import { SearchSortSelect } from "@/components/SearchSortSelect";
import { getPlaceAnalytics } from "@/lib/analytics";
import { cities, popularCities } from "@/lib/data/cities";
import { searchPlaces } from "@/lib/search/searchService";
import { searchFilterOptions } from "@/lib/searchFilters";
import { createSearchRecord, logImpressions } from "@/lib/tracking";

type SearchPageProps = {
  searchParams: Promise<{
    filter?: string | string[];
    filters?: string | string[];
    free_wifi?: string;
    q?: string | string[];
    category?: string | string[];
    lat?: string | string[];
    location?: string | string[];
    lon?: string | string[];
    sort?: "relevance" | "popularity" | "newest";
  }>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function paramValues(value: string | string[] | undefined) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function parseCoordinate(value: string | string[] | undefined) {
  const coordinate = Number(firstParam(value));

  return Number.isFinite(coordinate) ? coordinate : null;
}

function searchFiltersFromParams(params: Awaited<SearchPageProps["searchParams"]>) {
  const filters = [
    ...paramValues(params.filter),
    ...paramValues(params.filters),
    params.free_wifi ? "free_wifi" : null,
  ];

  return Array.from(
    new Set(
      filters
        .filter((filter): filter is string => Boolean(filter))
        .flatMap((filter) => filter.split(","))
        .map((filter) => filter.trim().toLowerCase().replaceAll("-", "_"))
        .filter((filter) => filter === "free_wifi"),
    ),
  );
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const rawQuery = firstParam(params.q) ?? "";
  const requestedCategory = firstParam(params.category);
  const requestedLocation = firstParam(params.location);
  const requestedSort = firstParam(params.sort);
  const activeFilters = searchFiltersFromParams(params);
  const latitude = parseCoordinate(params.lat);
  const longitude = parseCoordinate(params.lon);
  const userLocation =
    !requestedLocation && latitude !== null && longitude !== null
      ? { latitude, longitude }
      : null;
  const searchResult = await searchPlaces({
    category: requestedCategory,
    filters: activeFilters,
    limit: 100,
    location: requestedLocation,
    query: rawQuery,
    sort: requestedSort,
    userLocation,
  });
  const query = searchResult.normalizedQuery;
  const category = searchResult.category;
  const filters = searchResult.filters;
  const sort = searchResult.sort;
  const cityForSearch = searchResult.city;
  const activeUserLocation = searchResult.userLocationAvailable ? userLocation : null;
  const sorted = searchResult.results;
  const searchRecord = await createSearchRecord({
    query: rawQuery.trim() || "all places",
    normalizedQuery: query,
    detectedCategory: searchResult.detectedCategory,
    detectedLocation: searchResult.detectedLocation,
    resultCount: searchResult.totalCount,
    filtersUsed: searchResult.filtersUsed,
    userLocationAvailable: searchResult.userLocationAvailable,
    latencyMs: null,
  });
  await logImpressions({
    places: sorted.map((place) => ({ id: place.id, isSponsored: place.isSponsored })),
    searchId: searchRecord.id,
  });
  const mapPlaces = sorted
    .filter(
      (place) =>
        Number.isFinite(place.latitude) &&
        Number.isFinite(place.longitude) &&
        (place.latitude !== 0 || place.longitude !== 0),
    )
    .slice(0, 100);
  const cityLabel = cityForSearch
    ? `${cityForSearch.name}, ${cityForSearch.country}`
    : activeUserLocation
      ? "Near your position"
    : "All pilot cities";
  const activeFilter = searchFilterOptions.find((option) => option.id === category);
  const categoryLabel = category === "restaurants" ? "Food & drink" : activeFilter?.label ?? "Places";
  const pageTitle = query
    ? `Results for “${query}”`
    : category === "all"
      ? "Explore places"
      : `${categoryLabel} ${
          cityForSearch ? `in ${cityForSearch.name}` : activeUserLocation ? "near you" : "in pilot cities"
        }`;
  const donationUrl = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;
  const filterHiddenInputs = (prefix: string) =>
    filters.map((filter) => (
      <input key={`${prefix}-${filter}`} type="hidden" name="filter" value={filter} />
    ));

  return (
    <main>
      <ResponsiveContainer className="py-6 sm:py-8">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <SearchBar
            category={category}
            defaultValue={query}
            compact
            latitude={activeUserLocation?.latitude ?? null}
            location={activeUserLocation ? undefined : cityForSearch?.slug ?? requestedLocation}
            longitude={activeUserLocation?.longitude ?? null}
            sort={sort}
          />
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_220px_220px]">
            <CategoryFilter
              activeCategory={category}
              activeFilters={filters}
              latitude={activeUserLocation?.latitude ?? null}
              location={activeUserLocation ? undefined : cityForSearch?.slug ?? requestedLocation}
              longitude={activeUserLocation?.longitude ?? null}
              sort={sort}
            />
            <form action="/search" className="flex gap-2">
              <input type="hidden" name="category" value={category} />
              {filterHiddenInputs("location")}
              <input type="hidden" name="sort" value={sort} />
              <input
                name="location"
                defaultValue={cityForSearch?.name ?? requestedLocation}
                placeholder="City"
                className="h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
              />
              <button className="h-11 rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white">
                Go
              </button>
            </form>
            <SearchSortSelect
              category={category}
              filters={filters}
              latitude={activeUserLocation?.latitude ?? null}
              location={activeUserLocation ? null : cityForSearch?.slug ?? requestedLocation ?? null}
              longitude={activeUserLocation?.longitude ?? null}
              sort={sort}
            />
          </div>
          <CityPicker
            activeCitySlug={cityForSearch?.slug ?? null}
            category={category}
            cities={cities}
            filters={filters}
            popularCities={popularCities}
            sort={sort}
          />
        </div>

        <div className="mb-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_310px] lg:items-end">
          <div>
            <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
              {pageTitle}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              City: <span className="font-semibold text-slate-800">{cityLabel}</span>.
              {" "}
              {searchResult.totalCount} matching places. {mapPlaces.length} shown on map.
            </p>
          </div>
          {donationUrl ? (
            <a
              href={donationUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
            >
              <HeartHandshake aria-hidden="true" size={18} />
              Free for users. Donate.
            </a>
          ) : null}
        </div>

        <PlaceMap
          places={mapPlaces}
          city={activeUserLocation ? undefined : cityForSearch ?? undefined}
          initialUserLocation={activeUserLocation}
          preferUserLocation={Boolean(activeUserLocation)}
          showLocationControl
          title="Map view"
          subtitle={
            cityForSearch
              ? `Use your position when available, or browse ${cityForSearch.name}. ${mapPlaces.length} shown on map.`
              : userLocation
                ? `Centered on your position. ${mapPlaces.length} shown on map.`
              : `Use your position when available. ${mapPlaces.length} shown on map across pilot cities.`
          }
          heightClassName="h-[420px] sm:h-[520px] lg:h-[620px]"
          updateSearchOnLocate
        />

        <div className="mt-6 mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-slate-950">Places found</h2>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-600">
            <SlidersHorizontal aria-hidden="true" size={16} />
            Results update with your filters
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {sorted.map((place, index) => (
            <PlaceCard
              key={place.id}
              place={place}
              analytics={getPlaceAnalytics(place)}
              resultPosition={index + 1}
              searchId={searchRecord.id}
            />
          ))}
        </div>
        {sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
            <h2 className="text-lg font-semibold text-slate-950">No strong matches yet</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Try a broader search, choose Oslo, or use one of the category buttons above.
              The public POC searches demo listings and OpenStreetMap results where available.
            </p>
          </div>
        ) : null}
      </ResponsiveContainer>
    </main>
  );
}
