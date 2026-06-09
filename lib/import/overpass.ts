import type { PlaceCategory } from "@/lib/types";

const overpassTags: Record<PlaceCategory, string[]> = {
  restaurants: ['amenity="restaurant"'],
  cafes: ['amenity="cafe"'],
  hotels: ['tourism="hotel"'],
  attractions: ['tourism="attraction"'],
  activities: ['leisure="sports_centre"', 'tourism="theme_park"'],
  shops: ['shop'],
  marinas: ['leisure="marina"'],
  bars: ['amenity="bar"', 'amenity="pub"'],
  museums: ['tourism="museum"'],
  parks: ['leisure="park"'],
  "local-services": ['amenity="bicycle_rental"', 'tourism="information"'],
};

export type OverpassImportInput = {
  areaName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  categories: PlaceCategory[];
  limit: number;
};

export function buildOverpassQuery(input: OverpassImportInput) {
  const selectors = input.categories.flatMap((category) =>
    overpassTags[category].map(
      (tag) =>
        `node[${tag}](around:${input.radiusMeters},${input.latitude},${input.longitude});way[${tag}](around:${input.radiusMeters},${input.latitude},${input.longitude});`,
    ),
  );

  return `[out:json][timeout:25];(${selectors.join("")});out center ${input.limit};`;
}

export async function importFromOverpass(input: OverpassImportInput) {
  const query = buildOverpassQuery(input);

  // TODO: Persist imported places and import_batches in Supabase. For the MVP,
  // this returns normalized import metadata and avoids unofficial scraping.
  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ data: query }),
  });

  if (!response.ok) {
    throw new Error(`Overpass import failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    elements?: Array<{
      id: number;
      lat?: number;
      lon?: number;
      center?: { lat: number; lon: number };
      tags?: Record<string, string>;
      type: string;
    }>;
  };

  const imported = (data.elements ?? []).slice(0, input.limit).map((element) => {
    const tags = element.tags ?? {};
    const category =
      input.categories.find((candidate) =>
        overpassTags[candidate].some((tag) => {
          const [key, rawValue] = tag.split("=");
          const value = rawValue?.replaceAll('"', "");
          return value ? tags[key] === value : key in tags;
        }),
      ) ?? input.categories[0];

    return {
      source: "openstreetmap" as const,
      sourceId: `${element.type}/${element.id}`,
      name: tags.name ?? "Unnamed place",
      category,
      address: [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" "),
      latitude: element.lat ?? element.center?.lat ?? input.latitude,
      longitude: element.lon ?? element.center?.lon ?? input.longitude,
      websiteUrl: tags.website ?? tags["contact:website"] ?? null,
      phone: tags.phone ?? tags["contact:phone"] ?? null,
      tags: [category, input.areaName.toLowerCase(), tags.cuisine, tags.tourism, tags.amenity].filter(Boolean),
      description: `AI-ready description placeholder for ${tags.name ?? "this place"} in ${input.areaName}.`,
    };
  });

  return {
    batch: {
      source: "openstreetmap",
      areaName: input.areaName,
      latitude: input.latitude,
      longitude: input.longitude,
      radiusMeters: input.radiusMeters,
      categories: input.categories,
      requestedLimit: input.limit,
      importedCount: imported.length,
      skippedDuplicates: 0,
      createdAt: new Date().toISOString(),
    },
    imported,
  };
}
