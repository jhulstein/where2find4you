import type { Place } from "@/lib/types";

export function placeProfileHref(place: Place) {
  if (place.source === "openstreetmap" && place.sourceId) {
    return `https://www.openstreetmap.org/${place.sourceId}`;
  }

  return `/place/${place.slug}`;
}

export function isExternalPlaceProfile(place: Place) {
  return placeProfileHref(place).startsWith("http");
}
