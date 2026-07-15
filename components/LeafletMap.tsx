"use client";

import L from "leaflet";
import { Copy, ExternalLink, LoaderCircle, LocateFixed } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useMap } from "react-leaflet";
import type { PlaceMapProps } from "@/components/PlaceMap";
import { isExternalPlaceProfile, placeProfileHref } from "@/lib/placeLinks";
import type { Place } from "@/lib/types";

const defaultCenter: [number, number] = [59.9139, 10.7522];
type LocationState =
  | "idle"
  | "locating"
  | "ready"
  | "denied"
  | "timeout"
  | "unavailable"
  | "unsupported";

function mapCenter({ city, places }: PlaceMapProps): [number, number] {
  if (city) {
    return [city.latitude, city.longitude];
  }

  if (places.length === 0) {
    return defaultCenter;
  }

  const firstCity = places[0].city;
  const sameCityPlaces = places.filter((place) => place.city === firstCity);
  const centerPlaces = sameCityPlaces.length >= 2 ? sameCityPlaces : places.slice(0, 1);
  const latitude =
    centerPlaces.reduce((total, place) => total + place.latitude, 0) / centerPlaces.length;
  const longitude =
    centerPlaces.reduce((total, place) => total + place.longitude, 0) / centerPlaces.length;

  return [latitude, longitude];
}

function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, map, zoom]);

  return null;
}

function fitMapToPositions(map: L.Map, positions: Array<[number, number]>) {
  if (positions.length === 0) {
    return;
  }

  if (positions.length === 1) {
    map.setView(positions[0], 15, { animate: true });
    return;
  }

  map.fitBounds(L.latLngBounds(positions).pad(0.12), {
    animate: true,
    maxZoom: 15,
    padding: [36, 36],
  });
}

function FitResultsControl({ positions }: { positions: Array<[number, number]> }) {
  const map = useMap();

  useEffect(() => {
    if (positions.length === 0) {
      return;
    }

    const control = new L.Control({ position: "topleft" });

    control.onAdd = () => {
      const container = L.DomUtil.create(
        "div",
        "leaflet-control leaflet-bar fit-results-leaflet-control",
      );
      const button = L.DomUtil.create("button", "fit-results-button", container);

      button.type = "button";
      button.textContent = "Fit results";
      button.setAttribute("aria-label", "Fit map to result markers");
      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      L.DomEvent.on(button, "click", (event: Event) => {
        L.DomEvent.stop(event);
        fitMapToPositions(map, positions);
      });

      return container;
    };

    control.addTo(map);

    return () => {
      control.remove();
    };
  }, [map, positions]);

  return null;
}

function normalizeAddressPart(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function compactAddressParts(parts: Array<string | null | undefined>) {
  const seen = new Set<string>();

  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .filter((part) => {
      const normalized = normalizeAddressPart(part);

      if (!normalized || seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    })
    .join(", ");
}

function placeAddress(place: Place) {
  return compactAddressParts([place.address, place.city, place.country]);
}

function needsResolvedAddress(place: Place) {
  const address = place.address.trim();
  const normalizedAddress = normalizeAddressPart(address);
  const normalizedCity = normalizeAddressPart(place.city);
  const normalizedCountry = normalizeAddressPart(place.country);

  return (
    place.source === "openstreetmap" &&
    (!address ||
      normalizedAddress === normalizedCity ||
      normalizedAddress === normalizedCountry ||
      !/\d/.test(address))
  );
}

function PlacePopupContent({
  copied,
  isActive,
  onCopyAddress,
  place,
  score,
}: {
  copied: boolean;
  isActive: boolean;
  onCopyAddress: (placeId: string, address: string) => void;
  place: Place;
  score?: number;
}) {
  const [resolvedAddress, setResolvedAddress] = useState<string | null>(null);
  const profileHref = placeProfileHref(place);
  const profileIsExternal = isExternalPlaceProfile(place);
  const fallbackAddress = placeAddress(place);
  const visibleAddress = resolvedAddress ?? fallbackAddress;

  useEffect(() => {
    if (!isActive || !needsResolvedAddress(place)) {
      return;
    }

    const controller = new AbortController();
    const searchParams = new URLSearchParams({
      lat: place.latitude.toString(),
      lon: place.longitude.toString(),
    });

    void fetch(`/api/reverse-address?${searchParams.toString()}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: unknown) => {
        const address =
          data && typeof data === "object" && "address" in data
            ? (data as { address?: unknown }).address
            : null;

        if (typeof address === "string" && address.trim()) {
          setResolvedAddress(address);
        }
      })
      .catch(() => undefined);

    return () => controller.abort();
  }, [
    isActive,
    place,
    place.address,
    place.city,
    place.country,
    place.latitude,
    place.longitude,
    place.source,
  ]);

  return (
    <div className="min-w-56 max-w-64">
      <p className="font-semibold text-slate-950">{place.name}</p>
      <p className="mt-1 text-sm leading-5 text-slate-600">{visibleAddress || place.city}</p>
      {score ? <p className="mt-1 text-sm">Score {score}</p> : null}
      <div className="mt-3 flex flex-col gap-2">
        {place.websiteUrl ? (
          <a
            href={place.websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3 text-sm font-semibold !text-white transition hover:bg-teal-800 hover:!text-white"
          >
            Website
            <ExternalLink aria-hidden="true" size={14} className="!text-white" />
          </a>
        ) : null}
        <button
          type="button"
          onClick={() => onCopyAddress(place.id, visibleAddress || place.name)}
          className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition ${
            place.websiteUrl
              ? "border border-slate-200 text-slate-700 hover:bg-slate-50"
              : "bg-slate-950 text-white hover:bg-slate-800"
          }`}
        >
          <Copy aria-hidden="true" size={14} />
          {copied ? "Address copied" : "Copy address"}
        </button>
        {!profileIsExternal ? (
          <a
            href={profileHref}
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            View profile
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default function LeafletMap({
  city,
  defaultLocateRadiusKm = null,
  initialUserLocation = null,
  places,
  preferUserLocation = false,
  scores = [],
  showLocationControl = false,
  updateSearchOnLocate = false,
}: PlaceMapProps) {
  const initialPosition = initialUserLocation
    ? [initialUserLocation.latitude, initialUserLocation.longitude] as [number, number]
    : null;
  const [userPosition, setUserPosition] = useState<[number, number] | null>(initialPosition);
  const [locationState, setLocationState] = useState<LocationState>(
    initialPosition ? "ready" : "idle",
  );
  const [copiedPlaceId, setCopiedPlaceId] = useState<string | null>(null);
  const [activePopupPlaceId, setActivePopupPlaceId] = useState<string | null>(null);
  const scoreByPlaceId = scores.reduce<Record<string, number>>(
    (accumulator, score) => {
      accumulator[score.placeId] = score.totalScore;
      return accumulator;
    },
    {},
  );
  const fallbackCenter = useMemo(() => mapCenter({ city, places, scores }), [city, places, scores]);
  const resultPositions = useMemo(
    () => places.map((place) => [place.latitude, place.longitude] as [number, number]),
    [places],
  );
  const center = userPosition ?? fallbackCenter;
  const zoom = userPosition ? 15 : city && places.length === 0 ? 12 : places.length > 1 ? 13 : 14;

  const requestUserPosition = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setLocationState("unsupported");
      return;
    }

    setLocationState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextPosition: [number, number] = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        setUserPosition(nextPosition);
        setLocationState("ready");

        if (updateSearchOnLocate) {
          const searchParams = new URLSearchParams(window.location.search);

          searchParams.set("lat", nextPosition[0].toFixed(6));
          searchParams.set("lon", nextPosition[1].toFixed(6));
          if (!searchParams.has("radius") && Number.isFinite(defaultLocateRadiusKm)) {
            searchParams.set("radius", String(defaultLocateRadiusKm));
          }
          searchParams.delete("location");

          window.location.assign(`/search?${searchParams.toString()}`);
        }
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
  }, [defaultLocateRadiusKm, updateSearchOnLocate]);

  const copyAddress = useCallback(async (placeId: string, address: string) => {
    if (!address || !("clipboard" in navigator)) {
      return;
    }

    try {
      await navigator.clipboard.writeText(address);
      setCopiedPlaceId(placeId);
      window.setTimeout(
        () => setCopiedPlaceId((current) => (current === placeId ? null : current)),
        1800,
      );
    } catch {
      setCopiedPlaceId(null);
    }
  }, []);

  useEffect(() => {
    if (!preferUserLocation || !("permissions" in navigator)) {
      return;
    }

    void navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((permission) => {
        if (permission.state === "granted") {
          requestUserPosition();
        }
      })
      .catch(() => undefined);
  }, [preferUserLocation, requestUserPosition]);

  const markerIcon = L.divIcon({
    className: "",
    html: '<span class="scout-marker">W2</span>',
    iconAnchor: [15, 15],
    iconSize: [30, 30],
    popupAnchor: [0, -12],
  });
  const cityIcon = L.divIcon({
    className: "",
    html: '<span class="city-marker">City</span>',
    iconAnchor: [22, 16],
    iconSize: [44, 32],
    popupAnchor: [0, -14],
  });
  const userIcon = L.divIcon({
    className: "",
    html: '<span class="user-position-marker"><span></span></span>',
    iconAnchor: [15, 15],
    iconSize: [30, 30],
    popupAnchor: [0, -12],
  });
  const fallbackLabel = city?.name ?? "results";
  const locationMessage =
    locationState === "locating"
      ? "Finding you..."
      : locationState === "ready"
        ? "Centered on you."
        : locationState === "denied"
          ? `Location is off. Showing ${fallbackLabel}.`
          : locationState === "timeout"
            ? `Could not find you yet. Showing ${fallbackLabel}.`
            : locationState === "unavailable" || locationState === "unsupported"
              ? `Location is unavailable. Showing ${fallbackLabel}.`
              : null;

  return (
    <div className="relative h-full">
      {showLocationControl ? (
        <div className="absolute right-3 top-3 z-[500] flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={requestUserPosition}
            disabled={locationState === "locating"}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-75"
          >
            {locationState === "locating" ? (
              <LoaderCircle aria-hidden="true" size={16} className="animate-spin" />
            ) : (
              <LocateFixed aria-hidden="true" size={16} />
            )}
            {locationState === "locating"
              ? "Loading..."
              : locationState === "ready"
                ? "Your position"
                : "Use my position"}
          </button>
          {locationMessage ? (
            <p
              aria-live="polite"
              className="max-w-48 rounded-lg bg-slate-950/90 px-3 py-2 text-right text-xs leading-5 text-white shadow-sm"
            >
              {locationMessage}
            </p>
          ) : null}
        </div>
      ) : null}
      <MapContainer center={center} scrollWheelZoom={false} zoom={zoom}>
        <RecenterMap center={center} zoom={zoom} />
        <FitResultsControl positions={resultPositions} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userPosition ? (
          <Marker icon={userIcon} position={userPosition}>
            <Popup>
              <div className="min-w-36">
                <p className="font-semibold">Your position</p>
                <p className="text-sm text-slate-600">Search from here.</p>
              </div>
            </Popup>
          </Marker>
        ) : null}
        {city ? (
          <Marker icon={cityIcon} position={[city.latitude, city.longitude]}>
            <Popup>
              <div className="min-w-36">
                <p className="font-semibold">{city.name}</p>
                <p className="text-sm text-slate-600">{city.country}</p>
              </div>
            </Popup>
          </Marker>
        ) : null}
        {places.map((place) => {
          return (
            <Marker
              key={place.id}
              eventHandlers={{
                popupclose: () =>
                  setActivePopupPlaceId((current) => (current === place.id ? null : current)),
                popupopen: () => setActivePopupPlaceId(place.id),
              }}
              icon={markerIcon}
              position={[place.latitude, place.longitude]}
            >
              <Popup>
                <PlacePopupContent
                  copied={copiedPlaceId === place.id}
                  isActive={activePopupPlaceId === place.id}
                  onCopyAddress={copyAddress}
                  place={place}
                  score={scoreByPlaceId[place.id]}
                />
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
