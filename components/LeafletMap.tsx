"use client";

import L from "leaflet";
import { LocateFixed } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { useMap } from "react-leaflet";
import type { PlaceMapProps } from "@/components/PlaceMap";

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
  places,
  preferUserLocation = false,
  scores = [],
  showLocationControl = false,
}: PlaceMapProps) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [locationState, setLocationState] = useState<LocationState>("idle");
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

  function requestUserPosition() {
    if (!("geolocation" in navigator)) {
      setLocationState("unsupported");
      return;
    }

    setLocationState("locating");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserPosition([position.coords.latitude, position.coords.longitude]);
        setLocationState("ready");
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
  }, [preferUserLocation]);

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
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50"
          >
            <LocateFixed aria-hidden="true" size={16} />
            {locationState === "ready" ? "Your position" : "Use my position"}
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
        {places.map((place) => (
          <Marker
            key={place.id}
            icon={markerIcon}
            position={[place.latitude, place.longitude]}
          >
            <Popup>
              <div className="min-w-44">
                <p className="font-semibold">{place.name}</p>
                <p className="text-sm capitalize">{place.category.replace("-", " ")}</p>
                <p className="mt-1 text-sm text-slate-600">{place.city}</p>
                {scoreByPlaceId[place.id] ? (
                  <p className="mt-1 text-sm">Score {scoreByPlaceId[place.id]}</p>
                ) : null}
                <a
                  href={`/place/${place.slug}`}
                  className="mt-2 inline-block text-sm font-semibold text-teal-700"
                >
                  View profile
                </a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
