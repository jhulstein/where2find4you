import Link from "next/link";
import { ArrowRight, MapPin, Radar, Sparkles, Wifi } from "lucide-react";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceMap } from "@/components/PlaceMap";
import { SearchBox } from "@/components/SearchBox";
import { cities, popularCities } from "@/lib/data/cities";
import { osloPlaces, placeScoresByPlaceId } from "@/lib/data/places";

export default function Home() {
  const oslo = cities.find((city) => city.slug === "oslo") ?? cities[0];
  const featuredPlaces = osloPlaces.slice(0, 3);

  return (
    <main>
      <section className="border-b border-stone-200 bg-stone-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-14">
          <div className="flex flex-col justify-center">
            <div className="mb-5 flex w-fit items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1 text-sm font-medium text-teal-800">
              <Radar aria-hidden="true" size={16} />
              AI city scouting
            </div>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-normal text-stone-950 sm:text-5xl">
              where2find4you
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-stone-700">
              AI agents scouting the city for free WiFi, work spots, rooftops
              and hidden gems.
            </p>
            <div className="mt-8">
              <SearchBox popularCities={popularCities} />
            </div>
            <div className="mt-8 grid gap-3 text-sm text-stone-700 sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2">
                <Wifi aria-hidden="true" size={17} className="text-teal-700" />
                Free WiFi places
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2">
                <Sparkles
                  aria-hidden="true"
                  size={17}
                  className="text-blue-700"
                />
                Work-ready signals
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2">
                <MapPin
                  aria-hidden="true"
                  size={17}
                  className="text-amber-700"
                />
                Local confidence
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-3">
              {featuredPlaces.map((place) => (
                <PlaceCard
                  key={place.id}
                  place={place}
                  score={placeScoresByPlaceId[place.id]}
                  compact
                />
              ))}
              <Link
                href="/city/oslo"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-stone-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-stone-800"
              >
                Explore Oslo
                <ArrowRight aria-hidden="true" size={17} />
              </Link>
            </div>
            <PlaceMap
              city={oslo}
              places={featuredPlaces}
              scores={featuredPlaces.map(
                (place) => placeScoresByPlaceId[place.id],
              )}
              heightClassName="h-[420px]"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-5">
          {popularCities.map((city) => (
            <Link
              key={city.slug}
              href={`/city/${city.slug}`}
              className="rounded-lg border border-stone-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-sm"
            >
              <p className="text-sm text-stone-500">Popular city</p>
              <p className="mt-1 font-semibold text-stone-950">{city.name}</p>
              <p className="text-sm text-stone-600">{city.country}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
