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

type NominatimPlace = {
  address?: Record<string, string | undefined>;
  category?: string;
  display_name?: string;
  extratags?: Record<string, string | undefined>;
  lat?: string;
  lon?: string;
  name?: string;
  osm_id?: number;
  osm_type?: string;
  place_id: number;
  type?: string;
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

const overpassEndpoints = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.openstreetmap.fr/api/interpreter",
];
const nominatimSearchEndpoint = "https://nominatim.openstreetmap.org/search";
const osmSearchTimeoutMs = 12000;
const nominatimSearchTimeoutMs = 8000;

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
  activities: [
    'amenity="cinema"',
    'amenity="theatre"',
    'leisure="playground"',
    'leisure="sports_centre"',
    'tourism="theme_park"',
    'tourism="attraction"',
  ],
  shops: ["shop"],
  marinas: ['leisure="marina"'],
  bars: ['amenity="bar"', 'amenity="pub"'],
  museums: ['tourism="museum"'],
  parks: ['leisure="park"', 'boundary="national_park"'],
  "local-services": [
    'amenity="atm"',
    'amenity="bank"',
    'amenity="bicycle_rental"',
    'amenity="charging_station"',
    'amenity="clinic"',
    'amenity="fuel"',
    'amenity="library"',
    'amenity="pharmacy"',
    'amenity="post_office"',
    'tourism="information"',
  ],
};

const broadDiscoveryCategories: PlaceCategory[] = [
  "restaurants",
  "cafes",
  "bars",
  "shops",
  "museums",
  "parks",
  "attractions",
  "activities",
  "marinas",
  "local-services",
  "hotels",
];

function uniqueSelectors(selectors: string[]) {
  return Array.from(new Set(selectors));
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/wi[\s-]?fi/g, "wifi");
}

const namedSearchStopTerms = new Set([
  "around",
  "bar",
  "bars",
  "best",
  "cafe",
  "cafes",
  "dining",
  "find",
  "food",
  "in",
  "me",
  "near",
  "nearby",
  "open",
  "quiet",
  "restaurant",
  "restaurants",
  "romantic",
  "show",
  "the",
  "things",
  "to",
  "waterfront",
  "wifi",
  "with",
]);

function namedSearchTerms(query: string) {
  return normalize(query)
    .replace(/[^\p{L}0-9]+/gu, " ")
    .split(" ")
    .map((term) => term.trim())
    .filter((term) => term.length >= 3 && !namedSearchStopTerms.has(term));
}

function shouldSearchNamedPlace(input: NormalizedOsmSearchInput) {
  return input.query.trim().length >= 3 && namedSearchTerms(input.query).length > 0;
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
    return uniqueSelectors([
      ...categorySelectors.attractions,
      ...categorySelectors.activities,
      ...categorySelectors.museums,
      ...categorySelectors.parks,
      ...categorySelectors.shops,
      ...categorySelectors.restaurants,
    ]);
  }

  return uniqueSelectors(
    broadDiscoveryCategories.flatMap((category) => categorySelectors[category]),
  );
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
  if (
    [
      "atm",
      "bank",
      "bicycle_rental",
      "charging_station",
      "clinic",
      "fuel",
      "library",
      "pharmacy",
      "post_office",
    ].includes(tags.amenity ?? "") ||
    tags.tourism === "information"
  ) {
    return "local-services";
  }
  if (
    ["cinema", "theatre"].includes(tags.amenity ?? "") ||
    ["playground", "sports_centre"].includes(tags.leisure ?? "") ||
    tags.tourism === "theme_park"
  ) {
    return "activities";
  }
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
  const streetLine = [tags["addr:street"], tags["addr:housenumber"]]
    .filter(Boolean)
    .join(" ");
  const namedPlace = tags["addr:place"] ?? tags["addr:neighbourhood"] ?? tags["addr:suburb"];
  const postcode = tags["addr:postcode"];

  return [streetLine || namedPlace, streetLine ? postcode : null].filter(Boolean).join(", ");
}

function compactAddressParts(parts: Array<string | null | undefined>) {
  const seen = new Set<string>();

  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .filter((part) => {
      const normalized = normalize(part);

      if (!normalized || seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    })
    .join(", ");
}

function cityFromNominatimAddress(address: NominatimPlace["address"]) {
  return (
    address?.city ??
    address?.town ??
    address?.village ??
    address?.municipality ??
    address?.county ??
    null
  );
}

function addressFromNominatim(result: NominatimPlace) {
  const address = result.address;

  if (!address) {
    return result.display_name ?? "";
  }

  const street = [
    address.road ??
      address.pedestrian ??
      address.footway ??
      address.path ??
      address.cycleway ??
      null,
    address.house_number,
  ]
    .filter(Boolean)
    .join(" ");
  const place =
    street ||
    address.amenity ||
    address.tourism ||
    address.shop ||
    address.neighbourhood ||
    address.suburb ||
    address.city_district ||
    null;
  const postcodeAndCity = [address.postcode, cityFromNominatimAddress(address)]
    .filter(Boolean)
    .join(" ");

  return compactAddressParts([place, postcodeAndCity, address.country]);
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
    `relation[${selector}](around:${radiusMeters},${city.latitude},${city.longitude});`,
  ].join("");
}

function buildSelectorQuery(
  input: NormalizedOsmSearchInput,
  selectors: string[],
  limit: number,
) {
  const radiusMeters = input.radiusKm
    ? Math.trunc(Math.max(0.1, Math.min(input.radiusKm, 100)) * 1000)
    : input.category === "all"
      ? 3500
      : 5500;
  const body = selectors
    .map((selector) => selectorQuery(selector, radiusMeters, input.city))
    .join("");

  return `[out:json][timeout:14];(${body});out center ${limit};`;
}

function searchRadiusKm(input: NormalizedOsmSearchInput) {
  if (input.radiusKm) {
    return Math.max(0.1, Math.min(input.radiusKm, 100));
  }

  return input.category === "all" ? 3.5 : 5.5;
}

function distanceKm(first: { latitude: number; longitude: number }, second: { latitude: number; longitude: number }) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latitudeDistance = toRadians(second.latitude - first.latitude);
  const longitudeDistance = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const a =
    Math.sin(latitudeDistance / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDistance / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function placeMergeKey(place: Place) {
  return `${place.name.toLowerCase()}-${place.latitude.toFixed(5)}-${place.longitude.toFixed(5)}`;
}

function nominatimTags(result: NominatimPlace) {
  const tags: Record<string, string> = {};

  for (const [key, value] of Object.entries(result.extratags ?? {})) {
    if (value) {
      tags[key] = value;
    }
  }

  if (result.category && result.type) {
    if (result.category === "amenity") tags.amenity = tags.amenity ?? result.type;
    if (result.category === "leisure") tags.leisure = tags.leisure ?? result.type;
    if (result.category === "shop") tags.shop = tags.shop ?? result.type;
    if (result.category === "tourism") tags.tourism = tags.tourism ?? result.type;
  }

  return tags;
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
  const address = addressFrom(tags);

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
    city: tags["addr:city"] ?? input.city.name,
    country: tags["addr:country"] ?? input.city.country,
    latitude,
    longitude,
    websiteUrl: tags.website ?? tags["contact:website"] ?? null,
    phone: tags.phone ?? tags["contact:phone"] ?? null,
    email: tags.email ?? tags["contact:email"] ?? null,
    imageUrl: null,
    source: "openstreetmap",
    sourceId: `${element.type}/${element.id}`,
    tags: tagList(tags, category, input.category, input.query),
    sponsored: false,
    isSponsored: false,
    sponsoredPriority: 0,
    isActive: true,
    rating: null,
    openingHours: tags.opening_hours ?? "Hours not provided",
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

function toPlaceFromNominatim(result: NominatimPlace, input: NormalizedOsmSearchInput): Place | null {
  const latitude = Number(result.lat);
  const longitude = Number(result.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  const maxDistanceKm = input.radiusKm ? searchRadiusKm(input) : 15;
  const distanceFromSearchCenter = distanceKm(
    { latitude, longitude },
    { latitude: input.city.latitude, longitude: input.city.longitude },
  );

  if (distanceFromSearchCenter > maxDistanceKm) {
    return null;
  }

  const name =
    result.name?.trim() ||
    result.address?.amenity?.trim() ||
    result.display_name?.split(",")[0]?.trim();

  if (!name) {
    return null;
  }

  const tags = nominatimTags(result);
  const category = categoryFor(tags, input.category);
  const osmType = result.osm_type?.toLowerCase();
  const sourceId =
    osmType && result.osm_id
      ? `${osmType}/${result.osm_id}`
      : `nominatim/${result.place_id}`;
  const id =
    osmType && result.osm_id
      ? `osm-${osmType}-${result.osm_id}`
      : `osm-nominatim-${result.place_id}`;

  return {
    id,
    name,
    slug: `osm-${slugify(name)}-${result.osm_id ?? result.place_id}`,
    category,
    description: `${name} is an OpenStreetMap place in ${input.city.name}.`,
    shortDescription:
      tags.cuisine ? `${tags.cuisine} place` : `${category.replace("-", " ")} from OpenStreetMap.`,
    address: addressFromNominatim(result),
    city: cityFromNominatimAddress(result.address) ?? input.city.name,
    country: result.address?.country ?? input.city.country,
    latitude,
    longitude,
    websiteUrl: tags.website ?? tags["contact:website"] ?? null,
    phone: tags.phone ?? tags["contact:phone"] ?? null,
    email: tags.email ?? tags["contact:email"] ?? null,
    imageUrl: null,
    source: "openstreetmap",
    sourceId,
    tags: tagList(tags, category, input.category, input.query),
    sponsored: false,
    isSponsored: false,
    sponsoredPriority: 0,
    isActive: true,
    rating: null,
    openingHours: tags.opening_hours ?? "Hours not provided",
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

async function searchNamedOsmPlaces(input: NormalizedOsmSearchInput): Promise<Place[]> {
  if (!shouldSearchNamedPlace(input)) {
    return [];
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), nominatimSearchTimeoutMs);
  const cityQuery = input.city.id === "near-me" ? "" : `${input.city.name} ${input.city.country}`;
  const searchParams = new URLSearchParams({
    addressdetails: "1",
    extratags: "1",
    format: "jsonv2",
    limit: String(Math.min(input.limit, 8)),
    q: [input.query, cityQuery].filter(Boolean).join(" "),
  });

  try {
    const response = await fetch(`${nominatimSearchEndpoint}?${searchParams.toString()}`, {
      headers: {
        accept: "application/json",
        "user-agent": "where2find4you-web/1.0",
      },
      next: { revalidate: 3600 },
      signal: controller.signal,
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as NominatimPlace[];

    return data
      .map((result) => toPlaceFromNominatim(result, input))
      .filter((place): place is Place => Boolean(place));
  } catch {
    return [];
  } finally {
    clearTimeout(timeout);
  }
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
  const selectors = selectorsFor(normalizedInput);
  const namedPlaces = await searchNamedOsmPlaces(normalizedInput);

  async function fetchElementsFromEndpoint(endpoint: string, query: string) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), osmSearchTimeoutMs);

    try {
      const response = await fetch(endpoint, {
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
        return null;
      }

      const data = (await response.json()) as { elements?: OsmElement[] };
      return data.elements ?? [];
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function fetchElements(query: string) {
    for (const endpoint of overpassEndpoints) {
      const elements = await fetchElementsFromEndpoint(endpoint, query);

      if (elements !== null) {
        return elements;
      }
    }

    return [];
  }

  const combinedQuery = buildSelectorQuery(normalizedInput, selectors, normalizedInput.limit);
  let elements = await fetchElements(combinedQuery);

  if (elements.length === 0 && selectors.length > 1) {
    const fallbackSelectorCount = normalizedInput.category === "all" ? 14 : 6;
    const perSelectorLimit = Math.max(
      20,
      Math.ceil(normalizedInput.limit / Math.min(selectors.length, fallbackSelectorCount)),
    );
    const splitElements = await Promise.all(
      selectors.slice(0, fallbackSelectorCount).map((selector) =>
        fetchElements(buildSelectorQuery(normalizedInput, [selector], perSelectorLimit)),
      ),
    );

    elements = splitElements.flat();
  }

  const overpassSeen = new Set<string>();

  const overpassPlaces = elements
    .map((element) => toPlace(element, normalizedInput))
    .filter((place): place is Place => Boolean(place))
    .filter((place) => {
      const key = placeMergeKey(place);

      if (overpassSeen.has(key)) {
        return false;
      }

      overpassSeen.add(key);
      return true;
    });
  const combinedSeen = new Set<string>();

  return [...namedPlaces, ...overpassPlaces]
    .filter((place) => {
      const key = placeMergeKey(place);

      if (combinedSeen.has(key)) {
        return false;
      }

      combinedSeen.add(key);
      return true;
    })
    .slice(0, normalizedInput.limit);
}
