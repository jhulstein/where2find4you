"use client";

import L from "leaflet";
import { Copy, ExternalLink, LoaderCircle, LocateFixed } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useMap } from "react-leaflet";
import type { PlaceMapProps } from "@/components/PlaceMap";
import { isExternalPlaceProfile, placeProfileHref } from "@/lib/placeLinks";

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

export default function LeafletMap({
  city,
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
  const scoreByPlaceId = scores.reduce<Record<string, number>>(
    (accumulator, score) => {
      accumulator[score.placeId] = score.totalScore;
      return accumulator;
    },
    {},
  );
  const fallbackCenter = useMemo(() => mapCenter({ city, places, scores }), [city, places, scores]);
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
  }, [updateSearchOnLocate]);

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
          const profileHref = placeProfileHref(place);
          const profileIsExternal = isExternalPlaceProfile(place);
          const fullAddress = [place.address, place.city, place.country].filter(Boolean).join(", ");
          const copied = copiedPlaceId === place.id;

          return (
            <Marker
              key={place.id}
              icon={markerIcon}
              position={[place.latitude, place.longitude]}
            >
              <Popup>
                <div className="min-w-56 max-w-64">
                  <p className="font-semibold text-slate-950">{place.name}</p>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{fullAddress || place.city}</p>
                  {scoreByPlaceId[place.id] ? (
                    <p className="mt-1 text-sm">Score {scoreByPlaceId[place.id]}</p>
                  ) : null}
                  <div className="mt-3 flex flex-col gap-2">
                    {place.websiteUrl ? (
                      <a
                        href={place.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-teal-700 px-3 text-sm font-semibold text-white transition hover:bg-teal-800"
                      >
                        Website
                        <ExternalLink aria-hidden="true" size={14} />
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => copyAddress(place.id, fullAddress || place.name)}
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
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
