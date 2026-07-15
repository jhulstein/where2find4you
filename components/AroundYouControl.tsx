"use client";

import { FormEvent, useState, useTransition } from "react";
import { LoaderCircle, LocateFixed } from "lucide-react";
import { useRouter } from "next/navigation";

const defaultRadiusKm = 0.5;
const minRadiusKm = 0.1;
const maxRadiusKm = 100;
const radiusOptions = [
  { label: "500 m", value: "0.5" },
  { label: "1 km", value: "1" },
  { label: "2 km", value: "2" },
  { label: "5 km", value: "5" },
  { label: "10 km", value: "10" },
  { label: "Custom", value: "custom" },
];

type AroundYouControlProps = {
  activeRadiusKm?: number | null;
  category?: string;
  className?: string;
  filters?: string[];
  query?: string;
  sort?: string;
};

type LocationState = "idle" | "locating" | "denied" | "timeout" | "unavailable" | "unsupported";

function clampRadiusKm(value: number) {
  return Math.max(minRadiusKm, Math.min(value, maxRadiusKm));
}

function radiusParam(value: number) {
  return clampRadiusKm(value)
    .toFixed(2)
    .replace(/\.?0+$/, "");
}

function parseRadius(value: string, fallback = defaultRadiusKm) {
  const parsed = Number(value.replace(",", "."));

  return Number.isFinite(parsed) ? clampRadiusKm(parsed) : fallback;
}

function optionValueFor(radiusKm: number | null | undefined) {
  if (!Number.isFinite(radiusKm)) {
    return "0.5";
  }

  const normalized = radiusParam(radiusKm ?? defaultRadiusKm);
  return radiusOptions.some((option) => option.value === normalized) ? normalized : "custom";
}

export function AroundYouControl({
  activeRadiusKm = null,
  category = "all",
  className = "",
  filters = [],
  query = "",
  sort = "relevance",
}: AroundYouControlProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [locationState, setLocationState] = useState<LocationState>("idle");
  const [selectedRadius, setSelectedRadius] = useState(optionValueFor(activeRadiusKm));
  const [customRadius, setCustomRadius] = useState(
    radiusParam(activeRadiusKm ?? defaultRadiusKm),
  );
  const isLocating = locationState === "locating" || isPending;
  const resolvedRadiusKm =
    selectedRadius === "custom"
      ? parseRadius(customRadius)
      : parseRadius(selectedRadius);
  const statusMessage =
    locationState === "denied"
      ? "Location is blocked in your browser."
      : locationState === "timeout"
        ? "Could not find your position yet."
        : locationState === "unavailable" || locationState === "unsupported"
          ? "Location is unavailable on this device."
          : null;

  function searchPath(latitude: number, longitude: number) {
    const searchParams = new URLSearchParams(window.location.search);

    searchParams.delete("location");
    searchParams.delete("filter");
    searchParams.delete("filters");
    searchParams.delete("free_wifi");
    searchParams.set("lat", latitude.toFixed(6));
    searchParams.set("lon", longitude.toFixed(6));
    searchParams.set("radius", radiusParam(resolvedRadiusKm));
    searchParams.set("category", category);
    searchParams.set("sort", sort);

    if (query) {
      searchParams.set("q", query);
    } else {
      searchParams.delete("q");
    }

    for (const filter of filters) {
      searchParams.append("filter", filter);
    }

    return `/search?${searchParams.toString()}`;
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!("geolocation" in navigator)) {
      setLocationState("unsupported");
      return;
    }

    setLocationState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const href = searchPath(position.coords.latitude, position.coords.longitude);

        setLocationState("idle");
        startTransition(() => {
          router.push(href);
        });
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationState("denied");
          return;
        }
        if (error.code === error.TIMEOUT) {
          setLocationState("timeout");
          return;
        }
        setLocationState("unavailable");
      },
      { enableHighAccuracy: true, maximumAge: 60000, timeout: 8000 },
    );
  }

  return (
    <form
      onSubmit={submit}
      className={`rounded-xl border border-teal-200 bg-teal-50/60 p-3 ${className}`}
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isLocating}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-wait disabled:opacity-75"
        >
          {isLocating ? (
            <LoaderCircle aria-hidden="true" size={17} className="animate-spin" />
          ) : (
            <LocateFixed aria-hidden="true" size={17} />
          )}
          Around you
        </button>

        <label className="sr-only" htmlFor="around-radius">
          Radius
        </label>
        <select
          id="around-radius"
          value={selectedRadius}
          onChange={(event) => setSelectedRadius(event.target.value)}
          className="h-11 rounded-lg border border-teal-200 bg-white px-3 text-sm font-medium text-slate-800 outline-none focus:border-teal-700 focus:ring-4 focus:ring-teal-100"
        >
          {radiusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {selectedRadius === "custom" ? (
          <div className="flex h-11 items-center rounded-lg border border-teal-200 bg-white px-3 focus-within:border-teal-700 focus-within:ring-4 focus-within:ring-teal-100">
            <label className="sr-only" htmlFor="around-custom-radius">
              Custom radius in kilometers
            </label>
            <input
              id="around-custom-radius"
              type="number"
              min={minRadiusKm}
              max={maxRadiusKm}
              step="0.1"
              value={customRadius}
              onChange={(event) => setCustomRadius(event.target.value)}
              className="h-full w-20 border-0 bg-transparent text-sm font-medium text-slate-800 outline-none"
            />
            <span className="text-sm font-medium text-slate-500">km</span>
          </div>
        ) : null}
      </div>
      {statusMessage ? (
        <p aria-live="polite" className="mt-2 text-xs font-medium text-rose-700">
          {statusMessage}
        </p>
      ) : null}
    </form>
  );
}
