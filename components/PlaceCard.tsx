import {
  ArrowUpRight,
  Globe2,
  MapPin,
  MousePointerClick,
  Phone,
  Star,
} from "lucide-react";
import { SponsoredBadge } from "@/components/SponsoredBadge";
import { TrackingLink } from "@/components/TrackingLink";
import { isExternalPlaceProfile, placeProfileHref } from "@/lib/placeLinks";
import type { Place, PlaceAnalytics } from "@/lib/types";

type PlaceCardProps = {
  place: Place;
  analytics?: PlaceAnalytics;
  compact?: boolean;
  resultPosition?: number;
  score?: unknown;
  searchId?: string | null;
};

export function PlaceCard({
  place,
  analytics,
  compact = false,
  resultPosition,
  searchId,
}: PlaceCardProps) {
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`;
  const profileHref = placeProfileHref(place);
  const profileIsExternal = isExternalPlaceProfile(place);

  return (
    <article className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
              {place.category.replace("-", " ")}
            </span>
            {place.isSponsored ? <SponsoredBadge /> : null}
          </div>
          <h2 className="mt-3 text-lg font-semibold text-slate-950">
            <TrackingLink
              href={profileHref}
              placeId={place.id}
              clickType="profile"
              resultPosition={resultPosition}
              searchId={searchId}
              className="hover:text-teal-800"
              target={profileIsExternal ? "_blank" : undefined}
              rel={profileIsExternal ? "noreferrer" : undefined}
            >
              {place.name}
            </TrackingLink>
          </h2>
        </div>
        <div className="flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-sm font-semibold text-amber-800">
          <Star aria-hidden="true" size={15} />
          {place.rating?.toFixed(1) ?? "New"}
        </div>
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-sm text-slate-600">
        <MapPin aria-hidden="true" className="mt-0.5 shrink-0" size={15} />
        <span>
          {place.address}, {place.city}
        </span>
      </p>

      <p className={`mt-3 text-sm leading-6 text-slate-700 ${compact ? "line-clamp-2" : ""}`}>
        {place.shortDescription}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {place.tags.slice(0, compact ? 3 : 5).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-50 px-2 py-1 text-xs text-slate-600"
          >
            {tag}
          </span>
        ))}
      </div>

      {analytics ? (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-slate-50 p-2">
            <p className="font-semibold text-slate-950">{analytics.impressions}</p>
            <p className="text-slate-500">Impr.</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <p className="font-semibold text-slate-950">{analytics.clicks}</p>
            <p className="text-slate-500">Clicks</p>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <p className="font-semibold text-slate-950">{analytics.ctr}%</p>
            <p className="text-slate-500">CTR</p>
          </div>
        </div>
      ) : null}

      <div className="mt-auto flex flex-col gap-2 pt-5 sm:flex-row">
        <TrackingLink
          href={profileHref}
          placeId={place.id}
          clickType="profile"
          resultPosition={resultPosition}
          searchId={searchId}
          className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          target={profileIsExternal ? "_blank" : undefined}
          rel={profileIsExternal ? "noreferrer" : undefined}
        >
          {profileIsExternal ? "Open in OSM" : "View profile"}
          <ArrowUpRight aria-hidden="true" size={16} />
        </TrackingLink>
        {place.websiteUrl ? (
          <TrackingLink
            href={place.websiteUrl}
            placeId={place.id}
            clickType="website"
            resultPosition={resultPosition}
            searchId={searchId}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <Globe2 aria-hidden="true" size={16} />
            Website
          </TrackingLink>
        ) : null}
        {place.phone ? (
          <TrackingLink
            href={`tel:${place.phone}`}
            placeId={place.id}
            clickType="phone"
            resultPosition={resultPosition}
            searchId={searchId}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            aria-label={`Call ${place.name}`}
          >
            <Phone aria-hidden="true" size={16} />
          </TrackingLink>
        ) : null}
        <TrackingLink
          href={mapUrl}
          placeId={place.id}
          clickType="map"
          resultPosition={resultPosition}
          searchId={searchId}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          target="_blank"
          rel="noreferrer"
          aria-label={`Open map for ${place.name}`}
        >
          <MapPin aria-hidden="true" size={16} />
        </TrackingLink>
      </div>

      {place.isSponsored ? (
        <p className="mt-3 flex items-center gap-1 text-xs text-slate-500">
          <MousePointerClick aria-hidden="true" size={13} />
          Sponsored performance is tracked separately from organic discovery.
        </p>
      ) : null}
    </article>
  );
}
