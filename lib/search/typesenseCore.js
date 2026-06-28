import {
  DEFAULT_SEARCH_RADIUS_KM,
  detectSearchIntent,
  normalizeQuery,
  searchIntents,
} from "./ranking.js";

export const TYPESENSE_PLACES_COLLECTION =
  process.env.TYPESENSE_COLLECTION || "places_v1";

const categoryAliasMap = {
  restaurants: searchIntents.restaurants.phrases,
  cafes: searchIntents.cafe.phrases,
  hotels: ["hotel", "hotels", "stay", "accommodation", "lobby"],
  attractions: ["attraction", "attractions", "landmark", "viewpoint", "things to do"],
  activities: ["activity", "activities", "experience", "tour", "family"],
  shops: ["shop", "shops", "shopping", "market", "gift", "souvenir"],
  marinas: ["marina", "marinas", "boat", "dock", "harbor", "waterfront"],
  bars: ["bar", "bars", "pub", "drinks", "cocktail", "rooftop"],
  museums: ["museum", "museums", "art", "culture", "exhibition"],
  parks: ["park", "parks", "green", "walk", "outdoors"],
  "local-services": ["local service", "services", "rental", "bike", "information"],
};

const wifiTerms = [
  "wifi",
  "wi-fi",
  "wi fi",
  "wireless internet",
  "internet access",
  "hotspot",
  "wlan",
];

const freeWifiTerms = [
  "free wifi",
  "free wi-fi",
  "complimentary wifi",
  "free internet",
  "public wifi",
  "no-cost internet",
  "included wifi",
];

function uniqueNormalized(values) {
  return Array.from(
    new Set(
      values
        .flatMap((value) => (Array.isArray(value) ? value : [value]))
        .filter((value) => value !== null && value !== undefined)
        .map((value) => normalizeQuery(value))
        .filter(Boolean),
    ),
  );
}

function textFromPlace(place) {
  return [
    place.name,
    place.category,
    ...(categoryAliasMap[place.category] ?? []),
    place.tags,
    place.amenities,
    place.features,
    place.shortDescription,
    place.description,
    place.address,
    place.city,
    place.country,
  ]
    .flat()
    .filter(Boolean)
    .join(" ");
}

function textHasAny(text, terms) {
  const normalizedText = normalizeQuery(text);
  return terms.some((term) => normalizedText.includes(normalizeQuery(term)));
}

function hasFreeWifiText(text) {
  const normalizedText = normalizeQuery(text);
  const hasWifi = textHasAny(normalizedText, wifiTerms);
  const hasFreeModifier = textHasAny(normalizedText, [
    "free",
    "complimentary",
    "public",
    "included",
    "no cost",
  ]);

  return (
    freeWifiTerms.some((term) => normalizedText.includes(normalizeQuery(term))) ||
    (hasWifi && hasFreeModifier)
  );
}

function isOpenNow(place) {
  const openingHours = normalizeQuery(place.openingHours);
  return openingHours.includes("open 24") || openingHours.includes("open daily");
}

function timestamp(value) {
  const parsed = Date.parse(value ?? "");
  return Number.isFinite(parsed) ? Math.trunc(parsed / 1000) : 0;
}

export function getCategoryAliases(category) {
  return uniqueNormalized([category, ...(categoryAliasMap[category] ?? [])]);
}

export function createTypesensePlaceDocument(place, options = {}) {
  const amenities = place.amenities ?? [];
  const features = place.features ?? [];
  const normalizedText = normalizeQuery(textFromPlace(place));
  const hasWifi =
    Boolean(place.hasWifi) ||
    Boolean(place.freeWifi) ||
    textHasAny(normalizedText, wifiTerms);
  const freeWifi =
    Boolean(place.freeWifi) ||
    hasFreeWifiText([...amenities, ...features, place.description, place.shortDescription].join(" "));
  const publicWifi =
    Boolean(place.publicWifi) ||
    textHasAny([...amenities, ...features, place.description, place.shortDescription].join(" "), [
      "public wifi",
      "public internet",
      "hotspot",
    ]);

  return {
    id: place.id,
    recordId: place.id,
    name: place.name,
    normalizedName: normalizeQuery(place.name),
    slug: place.slug,
    description: place.description,
    shortDescription: place.shortDescription,
    category: place.category,
    normalizedCategory: normalizeQuery(place.category),
    categoryAliases: getCategoryAliases(place.category),
    tags: place.tags ?? [],
    normalizedTags: uniqueNormalized(place.tags ?? []),
    amenities,
    normalizedAmenities: uniqueNormalized(amenities),
    features,
    normalizedFeatures: uniqueNormalized(features),
    searchText: normalizedText,
    address: place.address ?? "",
    city: place.city ?? "",
    country: place.country ?? "",
    location: [place.latitude, place.longitude],
    latitude: place.latitude,
    longitude: place.longitude,
    hasWifi,
    freeWifi,
    publicWifi,
    rating: Number(place.rating ?? 0),
    popularity: Number(options.popularity ?? 0),
    verified: Boolean(place.isVerified),
    openNow: isOpenNow(place),
    isSponsored: Boolean(place.isSponsored),
    sponsoredPriority: Number(place.sponsoredPriority ?? 0),
    isActive: Boolean(place.isActive),
    openingHours: place.openingHours,
    websiteUrl: place.websiteUrl,
    phone: place.phone,
    email: place.email,
    imageUrl: place.imageUrl,
    source: place.source,
    sourceId: place.sourceId,
    createdAt: place.createdAt,
    updatedAtIso: place.updatedAt,
    updatedAt: timestamp(place.updatedAt),
  };
}

export function placeFromTypesenseDocument(document) {
  return {
    id: document.recordId ?? document.id,
    name: document.name,
    slug: document.slug ?? document.recordId ?? document.id,
    category: document.category,
    description: document.description ?? "",
    shortDescription: document.shortDescription ?? document.description ?? "",
    address: document.address ?? "",
    city: document.city ?? "",
    country: document.country ?? "",
    latitude: Number(document.latitude ?? document.location?.[0] ?? 0),
    longitude: Number(document.longitude ?? document.location?.[1] ?? 0),
    websiteUrl: document.websiteUrl ?? null,
    phone: document.phone ?? null,
    email: document.email ?? null,
    imageUrl: document.imageUrl ?? null,
    source: document.source ?? "manual",
    sourceId: document.sourceId ?? document.recordId ?? document.id,
    tags: document.tags ?? [],
    amenities: document.amenities ?? [],
    features: document.features ?? [],
    hasWifi: Boolean(document.hasWifi),
    freeWifi: Boolean(document.freeWifi),
    isVerified: Boolean(document.verified),
    isSponsored: Boolean(document.isSponsored),
    sponsoredPriority: Number(document.sponsoredPriority ?? 0),
    isActive: document.isActive !== false,
    rating: Number(document.rating ?? 0) || null,
    openingHours: document.openingHours ?? "Hours not provided",
    createdAt: document.createdAt ?? new Date(0).toISOString(),
    updatedAt: document.updatedAtIso ?? new Date((document.updatedAt ?? 0) * 1000).toISOString(),
  };
}

export const typesensePlacesSchema = {
  name: TYPESENSE_PLACES_COLLECTION,
  fields: [
    { name: "id", type: "string" },
    { name: "recordId", type: "string", facet: true },
    { name: "name", type: "string" },
    { name: "normalizedName", type: "string" },
    { name: "slug", type: "string", facet: true },
    { name: "description", type: "string" },
    { name: "shortDescription", type: "string" },
    { name: "category", type: "string", facet: true },
    { name: "normalizedCategory", type: "string", facet: true },
    { name: "categoryAliases", type: "string[]", facet: true },
    { name: "tags", type: "string[]", facet: true },
    { name: "normalizedTags", type: "string[]", facet: true },
    { name: "amenities", type: "string[]", facet: true, optional: true },
    { name: "normalizedAmenities", type: "string[]", facet: true, optional: true },
    { name: "features", type: "string[]", facet: true, optional: true },
    { name: "normalizedFeatures", type: "string[]", facet: true, optional: true },
    { name: "searchText", type: "string" },
    { name: "address", type: "string" },
    { name: "city", type: "string", facet: true },
    { name: "country", type: "string", facet: true },
    { name: "location", type: "geopoint", optional: true },
    { name: "latitude", type: "float" },
    { name: "longitude", type: "float" },
    { name: "hasWifi", type: "bool", facet: true },
    { name: "freeWifi", type: "bool", facet: true },
    { name: "publicWifi", type: "bool", facet: true },
    { name: "rating", type: "float", sort: true },
    { name: "popularity", type: "int32", sort: true },
    { name: "verified", type: "bool", facet: true },
    { name: "openNow", type: "bool", facet: true },
    { name: "isSponsored", type: "bool", facet: true },
    { name: "sponsoredPriority", type: "int32", sort: true },
    { name: "isActive", type: "bool", facet: true },
    { name: "openingHours", type: "string" },
    { name: "websiteUrl", type: "string", optional: true },
    { name: "phone", type: "string", optional: true },
    { name: "email", type: "string", optional: true },
    { name: "imageUrl", type: "string", optional: true },
    { name: "source", type: "string", facet: true },
    { name: "sourceId", type: "string", optional: true },
    { name: "createdAt", type: "string" },
    { name: "updatedAtIso", type: "string" },
    { name: "updatedAt", type: "int64", sort: true },
  ],
  default_sorting_field: "popularity",
};

export const typesenseSynonyms = [
  {
    id: "restaurants-intent",
    synonyms: searchIntents.restaurants.phrases.map(normalizeQuery),
  },
  {
    id: "cafe-intent",
    synonyms: searchIntents.cafe.phrases.map(normalizeQuery),
  },
  {
    id: "wifi-intent",
    synonyms: searchIntents.wifi.phrases.map(normalizeQuery),
  },
  {
    id: "free-wifi-intent",
    synonyms: searchIntents["free-wifi"].phrases.map(normalizeQuery),
  },
];

function filterValue(value) {
  return `\`${String(value).replaceAll("`", "\\`")}\``;
}

function maybeLocationSort(location) {
  if (!location) {
    return null;
  }

  return `location(${location.latitude}, ${location.longitude}):asc`;
}

function maybeLocationFilter(location, radiusKm = DEFAULT_SEARCH_RADIUS_KM) {
  if (!location) {
    return null;
  }

  return `location:(${location.latitude}, ${location.longitude}, ${radiusKm} km)`;
}

function typesensePage({ offset = 0, pageSize = 20, page = null }) {
  if (Number.isFinite(page) && page > 0) {
    return Math.trunc(page);
  }

  return Math.floor(Math.max(0, offset) / pageSize) + 1;
}

export function buildTypesenseSearchParameters(input = {}) {
  const normalizedQuery = normalizeQuery(input.query ?? "");
  const intent = detectSearchIntent(normalizedQuery);
  const category = input.category ?? "all";
  const pageSize = Math.max(1, Math.min(Math.trunc(input.pageSize ?? input.limit ?? 20), 250));
  const page = typesensePage({ offset: input.offset, pageSize, page: input.page });
  const filters = ["isActive:=true"];
  const rankLocation = input.userLocation ?? input.location ?? null;
  const radiusKm = Number.isFinite(input.radiusKm)
    ? Math.max(1, Math.min(Math.trunc(input.radiusKm), 100))
    : DEFAULT_SEARCH_RADIUS_KM;
  const locationFilter = maybeLocationFilter(input.userLocation ?? null, radiusKm);

  if (input.location?.name) {
    filters.push(`city:=${filterValue(input.location.name)}`);
  }

  if (locationFilter) {
    filters.push(locationFilter);
  }

  if (category && category !== "all") {
    if (category === "free-wifi") {
      filters.push("(freeWifi:=true || publicWifi:=true || hasWifi:=true)");
    } else if (category === "rooftops") {
      filters.push("(normalizedTags:=rooftop || category:=bars)");
    } else {
      filters.push(`category:=${filterValue(category)}`);
    }
  }

  if ((intent.hasFreeWifiIntent || intent.hasWifiIntent) && category === "all") {
    filters.push("(freeWifi:=true || publicWifi:=true || hasWifi:=true)");
  }

  const sortFields = ["_text_match:desc"];
  const distanceSort = maybeLocationSort(rankLocation);

  if (input.sort === "popularity" && !normalizedQuery) {
    sortFields.push("popularity:desc");
  } else if (input.sort === "newest" && !normalizedQuery) {
    sortFields.push("updatedAt:desc");
  } else {
    if (distanceSort) {
      sortFields.push(distanceSort);
    }
    sortFields.push("verified:desc", "rating:desc", "popularity:desc", "updatedAt:desc");
  }

  return {
    q: normalizedQuery || "*",
    query_by: [
      "normalizedName",
      "name",
      "normalizedCategory",
      "category",
      "categoryAliases",
      "normalizedTags",
      "tags",
      "normalizedAmenities",
      "amenities",
      "normalizedFeatures",
      "features",
      "searchText",
      "description",
      "address",
    ].join(","),
    query_by_weights: "14,13,12,11,10,9,8,8,7,6,5,3,2,1",
    filter_by: filters.join(" && "),
    sort_by: sortFields.join(","),
    prefix: "true",
    num_typos: "2",
    prioritize_exact_match: "true",
    prioritize_token_position: "true",
    drop_tokens_threshold: "1",
    typo_tokens_threshold: "1",
    exhaustive_search: input.debug ? "true" : "false",
    include_fields: "*",
    page: String(page),
    per_page: String(pageSize),
  };
}
