import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Compass,
  LineChart,
  MapPin,
  Search,
  Sparkles,
} from "lucide-react";
import { AroundYouControl } from "@/components/AroundYouControl";
import { BusinessCTA } from "@/components/BusinessCTA";
import { PlaceCard } from "@/components/PlaceCard";
import { PlaceMap } from "@/components/PlaceMap";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { SearchBar } from "@/components/SearchBar";
import { popularCities } from "@/lib/data/cities";
import { exampleSearches } from "@/lib/data/exampleSearches";
import { activePlaces, categoryOptions, featuredPlaces } from "@/lib/data/places";

export default function Home() {
  const startMapPlaces = activePlaces
    .filter((place) => place.city === "Oslo")
    .slice(0, 8);

  return (
    <main>
      <section className="border-b border-slate-200 bg-[radial-gradient(circle_at_top_left,#ccfbf1,transparent_35%),linear-gradient(180deg,#ffffff,#f8fafc)]">
        <ResponsiveContainer className="py-10 sm:py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white px-3 py-1.5 text-sm font-semibold text-teal-800">
                <Sparkles aria-hidden="true" size={16} />
                AI-powered local discovery
              </div>
              <h1 className="max-w-4xl text-4xl font-semibold tracking-normal text-slate-950 sm:text-5xl lg:text-6xl">
                Find the right place, faster.
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
                AI-powered local discovery for people looking for places,
                services and experiences — and for businesses that want to be found.
              </p>
              <p className="mt-4 text-base font-semibold text-slate-950">
                We help people find places — and help places get found.
              </p>
              <div className="mt-8 max-w-4xl">
                <SearchBar />
                <AroundYouControl className="mt-3" />
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {popularCities.map((city) => (
                  <Link
                    key={city.id}
                    href={`/search?q=${encodeURIComponent(`things to do in ${city.name}`)}&location=${city.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900"
                  >
                    <MapPin aria-hidden="true" size={14} />
                    {city.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <PlaceMap
                places={startMapPlaces}
                title="Explore nearby places"
                heightClassName="h-[300px] sm:h-[360px] lg:h-[420px]"
              />
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="grid gap-3">
                {exampleSearches.map((query) => (
                  <Link
                    key={query}
                    href={`/search?q=${encodeURIComponent(query)}`}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:border-teal-200 hover:bg-teal-50"
                  >
                    <Search aria-hidden="true" className="mt-0.5 text-teal-700" size={18} />
                    <span className="text-sm font-medium leading-6 text-slate-700">
                      {query}
                    </span>
                  </Link>
                ))}
                </div>
              </div>
            </div>
          </div>
        </ResponsiveContainer>
      </section>

      <ResponsiveContainer className="py-10 sm:py-14">
        <section>
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-800">How it works</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950 sm:text-3xl">
                Discovery that creates business insight.
              </h2>
            </div>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 text-sm font-semibold text-teal-800"
            >
              Learn more
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Compass,
                title: "People search naturally",
                text: "Users ask for places, services, experiences, restaurants, marinas, cafés and attractions in plain language.",
              },
              {
                icon: Sparkles,
                title: "Relevant results are ranked",
                text: "The MVP uses deterministic matching now, with an OpenAI-ready service layer for richer intent detection later.",
              },
              {
                icon: BarChart3,
                title: "Interest becomes data",
                text: "Searches, impressions, profile views and clicks become aggregated insights for listed places and sales leads.",
              },
            ].map((item) => (
              <article key={item.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <item.icon aria-hidden="true" size={22} />
                </div>
                <h3 className="mt-4 font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6">
            <p className="text-sm font-semibold text-teal-800">Featured categories</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950 sm:text-3xl">
              Built to scale beyond one city.
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6">
            {categoryOptions.slice(0, 12).map((category) => (
              <Link
                key={category.id}
                href={`/search?category=${category.id}`}
                className="rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-sm"
              >
                <Building2 aria-hidden="true" size={20} className="text-teal-700" />
                <h3 className="mt-3 font-semibold text-slate-950">{category.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-teal-800">Featured places</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950 sm:text-3xl">
                Useful places to start.
              </h2>
            </div>
            <Link
              href="/search"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              View all places
              <ArrowRight aria-hidden="true" size={16} />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {featuredPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} compact />
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-[0.7fr_1.3fr] lg:items-stretch">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <LineChart aria-hidden="true" size={28} className="text-teal-700" />
            <h2 className="mt-4 text-2xl font-semibold text-slate-950">
              From search data to sales opportunities.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Run the pilot for a destination, measure demand, then contact
              high-performing places with visibility tools and enhanced profiles.
            </p>
          </div>
          <BusinessCTA />
        </section>
      </ResponsiveContainer>
    </main>
  );
}
