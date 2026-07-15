import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BarChart3,
  Clock3,
  ExternalLink,
  Globe2,
  MapPin,
  Megaphone,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { SponsoredBadge } from "@/components/SponsoredBadge";
import { PlaceViewTracker } from "@/components/PlaceViewTracker";
import { ProductAdSlot } from "@/components/ProductAdSlot";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { TrackingButton } from "@/components/TrackingButton";
import { TrackingLink } from "@/components/TrackingLink";
import { getPlaceAnalytics } from "@/lib/analytics";
import { getPlaceBySlug, samplePlaces } from "@/lib/data/places";
import { isSponsoredPlace } from "@/lib/placeMonetization";
import { getPromotedProductsForContext } from "@/lib/promotedProducts";

type PlacePageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return samplePlaces.map((place) => ({ id: place.slug }));
}

export async function generateMetadata({ params }: PlacePageProps): Promise<Metadata> {
  const { id } = await params;
  const place = getPlaceBySlug(id);

  return {
    title: place ? `${place.name} | where2find4you.com` : "Place not found",
  };
}

export default async function PlacePage({ params }: PlacePageProps) {
  const { id } = await params;
  const place = getPlaceBySlug(id);

  if (!place) {
    notFound();
  }

  const analytics = getPlaceAnalytics(place);
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
  const isSponsored = isSponsoredPlace(place);
  const promotedProducts = getPromotedProductsForContext({
    category: place.category,
    limit: 1,
    query: `${place.name} ${place.shortDescription}`,
    tags: place.tags,
  });

  return (
    <main>
      <PlaceViewTracker placeId={place.id} />
      <ResponsiveContainer className="py-6 sm:py-8">
        <Link href="/search" className="text-sm font-semibold text-teal-800">
          Back to search
        </Link>
        <section className="mt-4 grid gap-6 lg:grid-cols-[1fr_380px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                {place.category.replace("-", " ")}
              </span>
              {isSponsored ? <SponsoredBadge /> : null}
            </div>
            <h1 className="mt-4 text-3xl font-semibold text-slate-950 sm:text-4xl">
              {place.name}
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
              {place.description}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <p className="flex items-start gap-2 text-sm text-slate-700">
                <MapPin aria-hidden="true" className="mt-0.5 text-teal-700" size={18} />
                {place.address}, {place.city}, {place.country}
              </p>
              <p className="flex items-start gap-2 text-sm text-slate-700">
                <Clock3 aria-hidden="true" className="mt-0.5 text-teal-700" size={18} />
                {place.openingHours}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              {place.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-50 px-3 py-1.5 text-sm text-slate-600">
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <TrackingLink
                href={mapUrl}
                placeId={place.id}
                clickType="map"
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white hover:bg-teal-800"
              >
                <MapPin aria-hidden="true" size={17} />
                Map
              </TrackingLink>
              {place.websiteUrl ? (
                <TrackingLink
                  href={place.websiteUrl}
                  placeId={place.id}
                  clickType="website"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Globe2 aria-hidden="true" size={17} />
                  Website
                </TrackingLink>
              ) : null}
              {place.phone ? (
                <TrackingLink
                  href={`tel:${place.phone}`}
                  placeId={place.id}
                  clickType="phone"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Phone aria-hidden="true" size={17} />
                  Phone
                </TrackingLink>
              ) : null}
              <TrackingButton
                placeId={place.id}
                clickType="booking"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink aria-hidden="true" size={17} />
                Booking
              </TrackingButton>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <TrackingButton
                placeId={place.id}
                clickType="claim"
                className="min-h-12 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white"
              >
                Claim this place
              </TrackingButton>
              <TrackingButton
                placeId={place.id}
                clickType="promote"
                className="min-h-12 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white"
              >
                Promote this place
              </TrackingButton>
              <TrackingButton
                placeId={place.id}
                clickType="profile"
                className="min-h-12 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700"
              >
                Request analytics report
              </TrackingButton>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <ShieldCheck aria-hidden="true" size={24} className="text-teal-700" />
              <h2 className="mt-3 font-semibold text-slate-950">Source</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {place.source} {place.sourceId ? `• ${place.sourceId}` : ""}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <BarChart3 aria-hidden="true" size={24} className="text-teal-700" />
              <h2 className="mt-3 font-semibold text-slate-950">Discovery stats</h2>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 p-2">
                  <p className="font-semibold">{analytics.impressions}</p>
                  <p className="text-xs text-slate-500">Impr.</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <p className="font-semibold">{analytics.clicks}</p>
                  <p className="text-xs text-slate-500">Clicks</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-2">
                  <p className="font-semibold">{analytics.ctr}%</p>
                  <p className="text-xs text-slate-500">CTR</p>
                </div>
              </div>
            </div>
            {promotedProducts.length > 0 ? (
              <ProductAdSlot
                products={promotedProducts}
                variant="aside"
                contextLabel="A small recommendation related to this place."
              />
            ) : null}
            <div className="rounded-2xl bg-slate-950 p-5 text-white shadow-sm">
              <Megaphone aria-hidden="true" size={24} className="text-teal-300" />
              <h2 className="mt-3 font-semibold">Visibility opportunity</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Places with strong views and clicks can be offered enhanced
                profiles, lead generation and better visibility tools.
              </p>
            </div>
          </aside>
        </section>
      </ResponsiveContainer>
    </main>
  );
}
