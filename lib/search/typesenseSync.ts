import {
  deleteTypesensePlace,
  ensureTypesensePlacesCollection,
  importTypesensePlaces,
  isTypesenseConfigured,
  upsertTypesensePlace,
  upsertTypesenseSynonyms,
} from "@/lib/search/typesenseClient";
import type { Place } from "@/lib/types";

export async function syncTypesensePlace(
  place: Place,
  options: { popularity?: number } = {},
) {
  if (!isTypesenseConfigured()) {
    return { ok: false, skipped: true };
  }

  await ensureTypesensePlacesCollection();

  if (!place.isActive) {
    return deleteTypesensePlace(place.id);
  }

  return upsertTypesensePlace(place, options);
}

export async function removeTypesensePlace(recordId: string) {
  if (!isTypesenseConfigured()) {
    return { ok: false, skipped: true };
  }

  return deleteTypesensePlace(recordId);
}

export async function reindexTypesensePlaces(
  places: Place[],
  options: { getPopularity?: (place: Place) => number } = {},
) {
  if (!isTypesenseConfigured()) {
    return { ok: false, skipped: true };
  }

  const collection = await ensureTypesensePlacesCollection();
  const synonyms = await upsertTypesenseSynonyms();
  const imported = await importTypesensePlaces(places, options);

  return {
    collection,
    imported,
    ok: collection.ok && synonyms.ok && imported.ok,
    skipped: false,
    synonyms,
  };
}
