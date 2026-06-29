import type { City, Place, PlaceCategory } from "@/lib/types";
import type { SearchFilterId } from "@/lib/searchFilters";

type OsmElement = {
  center?: { lat: number; lon: number };
  id: number;
  lat?: number;
  lon?: number;
  tags?: Record<string, string>;
  type: string;
};

type OsmSearchInput = {
  category: SearchFilterId;
  city: City | null;
  detectedCategory: PlaceCategory | null;
  limit?: number;
  query: string;
  radiusKm?: number | null;
};

type NormalizedOsmSearchInput = Omit<OsmSearchInput, "city" | "limit"> & {
  city: City;
  limit: number;
};

const overpassEndpoint = "https://overpass-api.de/api/interpreter";
const osmSearchTimeoutMs = 12000;

const categorySelectors: Record<PlaceCategory, string[]> = {
  restaurants: [
    'amenity="restaurant"',
    'amenity="cafe"',
    'amenity="bar"',
    'amenity="pub"',
    'amenity="fast_food"',
    'amenity="food_court"',
  ],
  cafes: ['amenity="cafe"'],
  hotels: ['tourism="hotel"'],
  attractions: ['tourism="attraction"', 'tourism="viewpoint"'],
  activities: ['leisure="sports_centre"', 'tourism="theme_park"', 'tourism="attraction"'],
  shops: ["shop"],
  marinas: ['leisure="marina"'],
  bars: ['amenity="bar"', 'amenity="pub"'],
  museums: ['tourism="museum"'],
  parks: ['leisure="park"', 'boundary="national_park"'],
  "local-services": ['amenity="bicycle_rental"', 'tourism="information"', 'amenity="post_office"'],
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/wi[\s-]?fi/g, "wifi");
}

function selectorsFor(input: OsmSearchInput) {
  const normalizedQuery = normalize(input.query);
  const hasRestaurantIntent =
    input.category === "restaurants" ||
    [
      "restaurant",
      "restaurants",
      "food",
      "cafe",
      "dining",
      "bar",
      "bistro",
      "eatery",
      "pizza",
      "sushi",
      "burger",
      "lunch",
      "dinner",
      "mat",
      "middag",
      "kafe",
    ].some((term) => normalizedQuery.includes(term));

  if (input.category === "free-wifi" || normalizedQuery.includes("wifi")) {
    return [
      'internet_access="wlan"',
      'internet_access="yes"',
      'amenity="cafe"',
      'amenity="library"',
    ];
  }

  if (input.category === "rooftops" || normalizedQuery.includes("rooftop")) {
    return ['amenity="bar"', 'amenity="pub"', 'tourism="viewpoint"'];
  }

  if (hasRestaurantIntent) {
    return categorySelectors.restaurants;
  }

  if (input.category !== "all") {
    return categorySelectors[input.category] ?? [];
  }

  if (input.detectedCategory) {
    return categorySelectors[input.detectedCategory];
  }

  if (normalizedQuery.includes("things to do") || normalizedQuery.includes("experience")) {
    return [
      ...categorySelectors.attractions,
      ...categorySelectors.activities,
      ...categorySelectors.museums,
      ...categorySelectors.parks,
    ];
  }

  return [
    ...categorySelectors.restaurants,
    ...categorySelectors.cafes,
    ...categorySelectors.hotels,
    ...categorySelectors.attractions,
  ];
}

function categoryFor(tags: Record<string, string>, fallback: SearchFilterId): PlaceCategory {
  if (tags.amenity === "restaurant") return "restaurants";
  if (tags.amenity === "cafe") return "cafes";
  if (tags.amenity === "fast_food" || tags.amenity === "food_court") return "restaurants";
  if (tags.tourism === "hotel") return "hotels";
  if (tags.leisure === "marina") return "marinas";
  if (tags.amenity === "bar" || tags.amenity === "pub") return "bars";
  if (tags.tourism === "museum") return "museums";
  if (tags.leisure === "park" || tags.boundary === "national_park") return "parks";
  if (tags.shop) return "shops";
  if (tags.amenity === "bicycle_rental" || tags.tourism === "information") return "local-services";
  if (tags.tourism || tags.leisure) return "attractions";

  return fallback !== "all" && fallback !== "free-wifi" && fallback !== "rooftops"
    ? fallback
    : "attractions";
}

function tagList(
  tags: Record<string, string>,
  category: PlaceCategory,
  filter: SearchFilterId,
  query: string,
) {
  return Array.from(
    new Set(
      [
        category,
        filter === "free-wifi" ? "wifi" : null,
        filter === "rooftops" ? "rooftop" : null,
        tags.cuisine,
        tags.amenity,
        tags.tourism,
        tags.leisure,
        tags.shop,
        tags.internet_access ? "wifi" : null,
        normalize(query).includes("wifi") ? "wifi" : null,
      ].filter(Boolean) as string[],
    ),
  ).slice(0, 6);
}

function addressFrom(tags: Record<string, string>) {
  return [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
}

function slugify(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function selectorQuery(selector: string, radiusMeters: number, city: City) {
  return [
    `node[${selector}](around:${radiusMeters},${city.latitude},${city.longitude});`,
    `way[${selector}](around:${radiusMeters},${city.latitude},${city.longitude});`,
  ].join("");
}

function buildSelectorQuery(
  input: NormalizedOsmSearchInput,
  selectors: string[],
  limit: number,
) {
  const radiusMeters = input.radiusKm
    ? Math.trunc(Math.max(1, Math.min(input.radiusKm, 100)) * 1000)
    : input.category === "all"
      ? 3500
      : 5500;
  const body = selectors
    .map((selector) => selectorQuery(selector, radiusMeters, input.city))
    .join("");

  return `[out:json][timeout:14];(${body});out center ${limit};`;
}

function toPlace(element: OsmElement, input: NormalizedOsmSearchInput): Place | null {
  const tags = element.tags ?? {};
  const name = tags.name?.trim();

  if (!name) {
    return null;
  }

  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;

  if (!latitude || !longitude) {
    return null;
  }

  const category = categoryFor(tags, input.category);
  const address = addressFrom(tags) || input.city.name;

  return {
    id: `osm-${element.type}-${element.id}`,
    name,
    slug: `osm-${slugify(name)}-${element.id}`,
    category,
    description: `${name} is an OpenStreetMap place in ${input.city.name}.`,
    shortDescription: [
      input.category === "free-wifi" ? "Possible Wi-Fi-friendly place from OpenStreetMap." : null,
      input.category === "rooftops" ? "Rooftop or viewpoint-style place from OpenStreetMap." : null,
      tags.cuisine ? `${tags.cuisine} place` : null,
      tags.tourism ? `${tags.tourism} listing` : null,
      tags.amenity ? `${tags.amenity.replace("_", " ")} nearby` : null,
      tags.internet_access ? "Wi-Fi signal listed in OpenStreetMap" : null,
    ].find(Boolean) ?? `OpenStreetMap ${category.replace("-", " ")} listing.`,
    address,
    city: input.city.name,
    country: input.city.country,
    latitude,
    longitude,
    websiteUrl: tags.website ?? tags["contact:website"] ?? null,
    phone: tags.phone ?? tags["contact:phone"] ?? null,
    email: tags.email ?? tags["contact:email"] ?? null,
    imageUrl: null,
    source: "openstreetmap",
    sourceId: `${element.type}/${element.id}`,
    tags: tagList(tags, category, input.category, input.query),
    isSponsored: false,
    sponsoredPriority: 0,
    isActive: true,
    rating: null,
    openingHours: tags.opening_hours ?? "Hours not provided",
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

export async function searchOsmPlaces(input: OsmSearchInput): Promise<Place[]> {
  if (!input.city) {
    return [];
  }

  const normalizedInput: NormalizedOsmSearchInput = {
    ...input,
    city: input.city,
    limit: input.limit ?? 28,
  };
  const selectors = selectorsFor(normalizedInput).slice(0, 8);

  async function fetchElements(query: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), osmSearchTimeoutMs);

    try {
      const response = await fetch(overpassEndpoint, {
        body: new URLSearchParams({ data: query }),
        headers: {
          accept: "application/json",
          "content-type": "application/x-www-form-urlencoded",
          "user-agent": "where2find4you-web/1.0",
        },
        method: "POST",
        next: { revalidate: 3600 },
        signal: controller.signal,
      });

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as { elements?: OsmElement[] };
      return data.elements ?? [];
    } catch {
      return [];
    } finally {
      clearTimeout(timeout);
    }
  }

  const combinedQuery = buildSelectorQuery(normalizedInput, selectors, normalizedInput.limit);
  let elements = await fetchElements(combinedQuery);

  if (elements.length === 0 && selectors.length > 1) {
    const perSelectorLimit = Math.max(
      20,
      Math.ceil(normalizedInput.limit / Math.min(selectors.length, 6)),
    );
    const splitElements = await Promise.all(
      selectors.slice(0, 6).map((selector) =>
        fetchElements(buildSelectorQuery(normalizedInput, [selector], perSelectorLimit)),
      ),
    );

    elements = splitElements.flat();
  }

  const seen = new Set<string>();

  return elements
    .map((element) => toPlace(element, normalizedInput))
    .filter((place): place is Place => Boolean(place))
    .filter((place) => {
      const key = `${place.name.toLowerCase()}-${place.latitude.toFixed(5)}-${place.longitude.toFixed(5)}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    })
    .slice(0, normalizedInput.limit);
}
