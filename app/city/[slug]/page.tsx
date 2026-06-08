import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CityExplorer } from "@/components/CityExplorer";
import { cities } from "@/lib/data/cities";
import { osloPlaces, osloPlaceScores } from "@/lib/data/places";

type CityPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return cities.map((city) => ({ slug: city.slug }));
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const city = cities.find((item) => item.slug === slug);

  return {
    title: city
      ? `Best WiFi and work spots in ${city.name} | Eiffel Scout`
      : "City not found | Eiffel Scout",
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  const city = cities.find((item) => item.slug === slug);

  if (!city) {
    notFound();
  }

  const places = city.slug === "oslo" ? osloPlaces : [];
  const scores = city.slug === "oslo" ? osloPlaceScores : [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-800">{city.country}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-stone-950 sm:text-4xl">
            Best WiFi and work spots in {city.name}
          </h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-stone-600">
          Seeded MVP results for Oslo. Future scans can merge Google Places,
          OpenStreetMap, and AI verification signals.
        </p>
      </div>

      <CityExplorer city={city} places={places} scores={scores} />
    </main>
  );
}
