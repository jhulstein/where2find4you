import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  MapPin,
  MinusCircle,
} from "lucide-react";
import { PlaceMap } from "@/components/PlaceMap";
import { ScoreBadge } from "@/components/ScoreBadge";
import { cities } from "@/lib/data/cities";
import { osloPlaces, placeScoresByPlaceId } from "@/lib/data/places";

type PlacePageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return osloPlaces.map((place) => ({ id: place.id }));
}

export async function generateMetadata({
  params,
}: PlacePageProps): Promise<Metadata> {
  const { id } = await params;
  const place = osloPlaces.find((item) => item.id === id);

  return {
    title: place ? `${place.name} | where2find4you` : "Place not found",
  };
}

export default async function PlacePage({ params }: PlacePageProps) {
  const { id } = await params;
  const place = osloPlaces.find((item) => item.id === id);

  if (!place) {
    notFound();
  }

  const city = cities.find((item) => item.id === place.cityId) ?? cities[0];
  const score = placeScoresByPlaceId[place.id];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href={`/city/${city.slug}`}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition hover:text-stone-950"
      >
        <ArrowLeft aria-hidden="true" size={16} />
        Back to {city.name}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <section className="rounded-lg border border-stone-200 bg-white p-5 sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium text-teal-800">
                {place.category}
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-normal text-stone-950 sm:text-4xl">
                {place.name}
              </h1>
              <p className="mt-3 flex items-center gap-2 text-sm text-stone-600">
                <MapPin aria-hidden="true" size={16} />
                {place.address}
              </p>
            </div>
            <ScoreBadge label="Total" score={score.totalScore} size="large" />
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ScoreBadge label="WiFi" score={score.wifiScore} />
            <ScoreBadge label="Work" score={score.workScore} />
            <ScoreBadge label="Quiet" score={score.quietScore} />
            <ScoreBadge label="Confidence" score={score.confidenceScore} />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">
                Place summary
              </h2>
              <p className="mt-3 leading-7 text-stone-700">{score.summary}</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-stone-950">
                    <CheckCircle2
                      aria-hidden="true"
                      size={18}
                      className="text-teal-700"
                    />
                    Pros
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-700">
                    {score.pros.map((pro) => (
                      <li key={pro}>{pro}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="flex items-center gap-2 font-semibold text-stone-950">
                    <MinusCircle
                      aria-hidden="true"
                      size={18}
                      className="text-amber-700"
                    />
                    Cons
                  </h3>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-700">
                    {score.cons.map((con) => (
                      <li key={con}>{con}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <aside className="rounded-lg border border-stone-200 bg-stone-50 p-4">
              <h2 className="font-semibold text-stone-950">Source notes</h2>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-700">
                {score.sourceNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
              <dl className="mt-5 grid gap-3 text-sm">
                <div>
                  <dt className="text-stone-500">Last checked</dt>
                  <dd className="font-medium text-stone-950">
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                    }).format(new Date(score.checkedAt))}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-500">Opening hours</dt>
                  <dd className="font-medium text-stone-950">
                    {place.openingHours}
                  </dd>
                </div>
                {place.website ? (
                  <div>
                    <dt className="text-stone-500">Website</dt>
                    <dd>
                      <a
                        href={place.website}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-medium text-teal-800 hover:text-teal-950"
                      >
                        Visit site
                        <ExternalLink aria-hidden="true" size={14} />
                      </a>
                    </dd>
                  </div>
                ) : null}
              </dl>
            </aside>
          </div>
        </section>

        <PlaceMap
          city={city}
          places={[place]}
          scores={[score]}
          heightClassName="h-[520px]"
        />
      </div>
    </main>
  );
}
