import {
  buildTypesenseSearchParameters,
  createTypesensePlaceDocument,
  placeFromTypesenseDocument,
  TYPESENSE_PLACES_COLLECTION,
  typesensePlacesSchema,
  typesenseSynonyms,
  type TypesensePlaceDocument,
} from "@/lib/search/typesenseCore";
import type { City, Place } from "@/lib/types";
import type { SearchFilterId } from "@/lib/searchFilters";

type TypesenseConfig = {
  apiKey: string;
  collection: string;
  origin: string;
  searchKey: string;
};

export type TypesenseSearchDebugHit = {
  highlights?: unknown;
  id: string;
  rank: number;
  textMatch?: number;
};

export type TypesensePlaceSearchResult = {
  debug?: {
    hits: TypesenseSearchDebugHit[];
    parameters: Record<string, string>;
  };
  places: Place[];
  totalCount: number;
};

type TypesenseSearchResponse = {
  found?: number;
  hits?: Array<{
    document?: TypesensePlaceDocument;
    highlights?: unknown;
    text_match?: number;
  }>;
};

function getTypesenseConfig(): TypesenseConfig | null {
  const host = process.env.TYPESENSE_HOST;
  const apiKey = process.env.TYPESENSE_API_KEY;

  if (!host || !apiKey) {
    return null;
  }

  const protocol = process.env.TYPESENSE_PROTOCOL || "https";
  const port = process.env.TYPESENSE_PORT;
  const origin = `${protocol}://${host}${port ? `:${port}` : ""}`;

  return {
    apiKey,
    collection: process.env.TYPESENSE_COLLECTION || TYPESENSE_PLACES_COLLECTION,
    origin,
    searchKey: process.env.TYPESENSE_SEARCH_ONLY_API_KEY || apiKey,
  };
}

export function isTypesenseConfigured() {
  return getTypesenseConfig() !== null;
}

async function typesenseRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { searchOnly?: boolean } = {},
) {
  const config = getTypesenseConfig();

  if (!config) {
    return { data: null as T | null, ok: false, skipped: true };
  }

  const headers = new Headers(init.headers);
  if (!headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  headers.set("x-typesense-api-key", options.searchOnly ? config.searchKey : config.apiKey);

  const response = await fetch(`${config.origin}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const details = await response.text();
    console.error(`Typesense request failed: ${response.status} ${details}`);
    return { data: null as T | null, ok: false, skipped: false };
  }

  const text = await response.text();

  return {
    data: text ? (JSON.parse(text) as T) : (null as T | null),
    ok: true,
    skipped: false,
  };
}

function currentCollection() {
  return getTypesenseConfig()?.collection || TYPESENSE_PLACES_COLLECTION;
}

function searchPath(parameters: Record<string, string>) {
  const searchParams = new URLSearchParams(parameters);
  return `/collections/${encodeURIComponent(currentCollection())}/documents/search?${searchParams}`;
}

export async function searchTypesensePlaces(input: {
  category: SearchFilterId;
  debug?: boolean;
  limit?: number;
  location?: City | null;
  offset?: number;
  page?: number;
  pageSize?: number;
  query: string;
  radiusKm?: number | null;
  sort?: string | null;
  userLocation?: { latitude: number; longitude: number } | null;
}): Promise<TypesensePlaceSearchResult | null> {
  const parameters = buildTypesenseSearchParameters(input);

  try {
    const response = await typesenseRequest<TypesenseSearchResponse>(
      searchPath(parameters),
      { method: "GET" },
      { searchOnly: true },
    );

    if (!response.ok || !response.data) {
      return null;
    }

    const hits = response.data.hits ?? [];

    return {
      debug: input.debug
        ? {
            hits: hits.map((hit, index) => ({
              highlights: hit.highlights,
              id: hit.document?.recordId ?? hit.document?.id ?? `hit-${index}`,
              rank: index + 1,
              textMatch: hit.text_match,
            })),
            parameters,
          }
        : undefined,
      places: hits
        .map((hit) => hit.document)
        .filter((document): document is TypesensePlaceDocument => Boolean(document))
        .map(placeFromTypesenseDocument),
      totalCount: response.data.found ?? hits.length,
    };
  } catch (error) {
    console.error("Typesense search failed", error);
    return null;
  }
}

export async function ensureTypesensePlacesCollection() {
  const collection = currentCollection();
  const existing = await typesenseRequest(`/collections/${encodeURIComponent(collection)}`, {
    method: "GET",
  });

  if (existing.ok) {
    return { created: false, ok: true };
  }

  const schema = {
    ...typesensePlacesSchema,
    name: collection,
  };
  const created = await typesenseRequest(`/collections`, {
    body: JSON.stringify(schema),
    method: "POST",
  });

  return { created: created.ok, ok: created.ok };
}

export async function upsertTypesenseSynonyms() {
  const collection = currentCollection();
  const results = await Promise.all(
    typesenseSynonyms.map((synonym) =>
      typesenseRequest(
        `/collections/${encodeURIComponent(collection)}/synonyms/${encodeURIComponent(synonym.id)}`,
        {
          body: JSON.stringify({ synonyms: synonym.synonyms }),
          method: "PUT",
        },
      ),
    ),
  );

  return {
    ok: results.every((result) => result.ok),
    results,
  };
}

export async function upsertTypesensePlace(place: Place, options: { popularity?: number } = {}) {
  const collection = currentCollection();
  const document = createTypesensePlaceDocument(place, options);

  return typesenseRequest(
    `/collections/${encodeURIComponent(collection)}/documents?action=upsert`,
    {
      body: JSON.stringify(document),
      method: "POST",
    },
  );
}

export async function deleteTypesensePlace(recordId: string) {
  const collection = currentCollection();

  return typesenseRequest(
    `/collections/${encodeURIComponent(collection)}/documents/${encodeURIComponent(recordId)}`,
    { method: "DELETE" },
  );
}

export async function importTypesensePlaces(
  places: Place[],
  options: { getPopularity?: (place: Place) => number } = {},
) {
  const config = getTypesenseConfig();

  if (!config) {
    return { data: null as string | null, ok: false, skipped: true };
  }

  const collection = config.collection;
  const documents = places
    .filter((place) => place.isActive)
    .map((place) =>
      createTypesensePlaceDocument(place, {
        popularity: options.getPopularity?.(place) ?? 0,
      }),
    );
  const body = documents.map((document) => JSON.stringify(document)).join("\n");

  try {
    const response = await fetch(
      `${config.origin}/collections/${encodeURIComponent(collection)}/documents/import?action=upsert`,
      {
        body,
        headers: {
          "content-type": "text/plain",
          "x-typesense-api-key": config.apiKey,
        },
        method: "POST",
      },
    );

    if (!response.ok) {
      const details = await response.text();
      console.error(`Typesense import failed: ${response.status} ${details}`);
      return { data: null as string | null, ok: false, skipped: false };
    }

    return { data: await response.text(), ok: true, skipped: false };
  } catch (error) {
    console.error("Typesense import failed", error);
    return { data: null as string | null, ok: false, skipped: false };
  }
}
