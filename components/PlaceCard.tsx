"use client";

import Link from "next/link";
import {
  Building2,
  Clock3,
  Laptop,
  MapPin,
  Volume2,
  Wifi,
} from "lucide-react";
import type { Place, PlaceScore } from "@/lib/types";
import { ScoreBadge } from "@/components/ScoreBadge";

type PlaceCardProps = {
  place: Place;
  score: PlaceScore;
  compact?: boolean;
};

export function PlaceCard({ place, score, compact = false }: PlaceCardProps) {
  return (
    <Link
      href={`/place/${place.id}`}
      className="block rounded-lg border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-medium text-teal-800">
            <Building2 aria-hidden="true" size={15} />
            {place.category}
          </p>
          <h2 className="mt-1 text-lg font-semibold text-stone-950">
            {place.name}
          </h2>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-600">
            <MapPin aria-hidden="true" size={15} />
            <span>{place.address}</span>
          </p>
        </div>
        <ScoreBadge label="Score" score={score.totalScore} />
      </div>

      {!compact ? (
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-stone-700">
          {score.summary}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-stone-700">
        <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-1">
          <Wifi aria-hidden="true" size={13} />
          WiFi {score.wifiScore}
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-1">
          <Laptop aria-hidden="true" size={13} />
          Work {score.workScore}
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-1">
          <Volume2 aria-hidden="true" size={13} />
          Quiet {score.quietScore}
        </span>
        <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-1">
          <Clock3 aria-hidden="true" size={13} />
          {place.openingHours}
        </span>
      </div>
    </Link>
  );
}
