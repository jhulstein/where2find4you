const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "at",
  "best",
  "can",
  "do",
  "find",
  "for",
  "i",
  "in",
  "is",
  "me",
  "near",
  "nearby",
  "of",
  "on",
  "or",
  "please",
  "show",
  "the",
  "thing",
  "things",
  "to",
  "today",
  "what",
  "where",
  "with",
]);

export const searchIntents = {
  restaurants: {
    category: "restaurants",
    phrases: [
      "restaurant",
      "restaurants",
      "resturant",
      "resturants",
      "restauranter",
      "restauranger",
      "restaurang",
      "spisested",
      "spisesteder",
      "dinner",
      "dining",
      "food",
      "meal",
      "seafood",
      "middag",
      "mat",
    ],
    terms: [
      "restaurant",
      "dinner",
      "dining",
      "food",
      "meal",
      "seafood",
      "restauranter",
      "restauranger",
      "restaurang",
      "spisested",
      "spisesteder",
      "middag",
      "mat",
    ],
  },
  cafe: {
    category: "cafes",
    phrases: [
      "cafe",
      "cafes",
      "café",
      "cafés",
      "cafe's",
      "cafe’s",
      "coffee",
      "coffee shop",
      "coffeehouse",
      "espresso bar",
      "kafé",
      "kaffebar",
      "kaffe",
    ],
    terms: ["cafe", "coffee", "coffeehouse", "espresso", "kafe", "kaffebar", "kaffe"],
  },
  wifi: {
    phrases: [
      "wifi",
      "wi-fi",
      "wi fi",
      "wireless internet",
      "internet access",
      "hotspot",
      "wlan",
    ],
    terms: ["wifi", "wireless", "internet", "hotspot", "wlan"],
  },
  "free-wifi": {
    phrases: [
      "free wifi",
      "free wi-fi",
      "free wi fi",
      "complimentary wifi",
      "public wifi",
      "free internet",
      "no-cost internet",
      "no cost internet",
      "included wifi",
    ],
    terms: [
      "free",
      "wifi",
      "wireless",
      "internet",
      "hotspot",
      "wlan",
      "complimentary",
      "public",
      "included",
    ],
  },
};

const categoryAliases = {
  restaurants: [
    "restaurant",
    "restaurants",
    "resturant",
    "resturants",
    "restauranter",
    "restauranger",
    "restaurang",
    "spisested",
    "spisesteder",
    "dinner",
    "dining",
    "food",
    "meal",
    "seafood",
    "middag",
    "mat",
  ],
  cafes: [
    "cafe",
    "cafes",
    "café",
    "cafés",
    "coffee",
    "coffee shop",
    "coffeehouse",
    "espresso bar",
    "kafé",
    "kaffebar",
    "kaffe",
  ],
  hotels: ["hotel", "hotels", "stay", "lobby", "accommodation"],
  attractions: ["attraction", "attractions", "landmark", "viewpoint", "things to do"],
  activities: ["activity", "activities", "experience", "tour", "family", "families"],
  shops: ["shop", "shops", "shopping", "market", "gift", "souvenir"],
  marinas: ["marina", "marinas", "boat", "dock", "harbor", "waterfront"],
  bars: ["bar", "bars", "pub", "drinks", "cocktail", "rooftop"],
  museums: ["museum", "museums", "art", "culture", "exhibition"],
  parks: ["park", "parks", "green", "walk", "outdoors"],
  "local-services": ["local service", "services", "rental", "bike", "information"],
};

const termExpansions = {
  accommodation: ["hotel", "stay"],
  bar: ["drinks", "cocktail"],
  bars: ["bar", "drinks", "cocktail"],
  bike: ["rental", "transport"],
  cafe: ["coffee", "coffeehouse", "espresso", "kafe", "kaffebar", "kaffe"],
  cafes: ["cafe", "coffee", "coffeehouse", "espresso", "kafe", "kaffebar", "kaffe"],
  complimentary: ["free", "included"],
  coffee: ["cafe"],
  coffeehouse: ["cafe", "coffee"],
  dining: ["restaurant", "dinner", "food", "meal"],
  espresso: ["cafe", "coffee"],
  free: ["complimentary", "included", "public", "no cost"],
  dinner: ["restaurant", "food"],
  food: ["restaurant", "market"],
  hotspot: ["wifi", "internet", "wlan"],
  hotel: ["stay", "accommodation"],
  hotels: ["hotel", "stay", "accommodation"],
  internet: ["wifi", "wlan", "hotspot"],
  included: ["free", "complimentary"],
  kaffebar: ["cafe", "coffee"],
  kaffe: ["cafe", "coffee"],
  kayak: ["activity", "rental"],
  kafe: ["cafe", "coffee"],
  marina: ["boats", "dock", "harbor"],
  marinas: ["marina", "boats", "dock", "harbor"],
  middag: ["dinner"],
  museum: ["art", "culture", "exhibition"],
  museums: ["museum", "art", "culture", "exhibition"],
  park: ["green", "walk", "outdoors"],
  parks: ["park", "green", "walk", "outdoors"],
  restaurant: ["dinner", "food", "meal"],
  restaurang: ["restaurant", "dinner", "food", "meal"],
  restauranger: ["restaurant", "dinner", "food", "meal"],
  restauranter: ["restaurant", "dinner", "food", "meal"],
  restaurants: ["restaurant", "dinner", "food", "meal"],
  resturant: ["restaurant", "dinner", "food", "meal"],
  resturants: ["restaurant", "dinner", "food", "meal"],
  rooftop: ["roof", "view", "bar"],
  rooftops: ["rooftop", "roof", "view", "bar"],
  shopping: ["shop", "market", "gifts"],
  wifi: ["internet", "wireless", "hotspot", "wlan", "laptop", "work"],
  wireless: ["wifi", "internet", "wlan"],
  wlan: ["wifi", "internet", "wireless"],
};

const broadIntentCategories = new Set([
  "attractions",
  "activities",
  "parks",
  "museums",
  "local-services",
]);

const matchTiers = {
  exactName: 120,
  exactCategory: 110,
  structuredAmenity: 100,
  tag: 85,
  prefixName: 80,
  synonymCategoryAmenity: 70,
  fuzzyName: 55,
  description: 30,
  none: 0,
};

export const DEFAULT_SEARCH_RADIUS_KM = 15;

export function normalizeQuery(value = "") {
  const withoutDiacritics = String(value)
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  return withoutDiacritics
    .replace(/\b([a-z0-9]+)'s\b/g, "$1")
    .replace(/\bwi[\s-]*fi+\b/g, "wifi")
    .replace(/&/g, " and ")
    .replace(/-/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\bcafes\b/g, "cafe");
}

export function singularizeSearchTerm(term) {
  if (term.endsWith("ies") && term.length > 4) {
    return `${term.slice(0, -3)}y`;
  }

  if (term.endsWith("s") && term.length > 3) {
    return term.slice(0, -1);
  }

  return term;
}

function singularize(term) {
  return singularizeSearchTerm(term);
}

function normalizedIntentPhrases(intent) {
  return intent.phrases.map(normalizeQuery);
}

export function detectSearchIntent(query) {
  const normalized = normalizeQuery(query);
  const normalizedWords = normalized.split(" ").filter(Boolean);
  const phraseMatches = Object.entries(searchIntents)
    .filter(([, intent]) =>
      normalizedIntentPhrases(intent).some((phrase) =>
        normalized === phrase || normalized.includes(phrase),
      ),
    )
    .map(([id]) => id);
  const rawTerms = normalized.split(" ").filter(Boolean);
  const terms = rawTerms.map(singularize);
  const termMatches = Object.entries(searchIntents)
    .filter(([, intent]) =>
      intent.terms.some((term) => terms.includes(singularize(normalizeQuery(term)))),
    )
    .map(([id]) => id);
  const intents = Array.from(new Set([...phraseMatches, ...termMatches]));

  if (intents.includes("free-wifi") && !intents.includes("wifi")) {
    intents.push("wifi");
  }
  const detectedCategory =
    (intents.includes("restaurants") ? "restaurants" : null) ??
    (intents.includes("cafe") ? "cafes" : null) ??
    Object.entries(categoryAliases).find(([category, aliases]) =>
      [category, ...aliases]
        .map(normalizeQuery)
        .some((alias) =>
          normalized === alias ||
          (alias.includes(" ") ? normalized.includes(alias) : normalizedWords.includes(alias)),
        ),
    )?.[0] ??
    null;

  return {
    detectedCategory,
    hasCafeIntent: intents.includes("cafe"),
    hasFreeWifiIntent: intents.includes("free-wifi"),
    hasWifiIntent: intents.includes("wifi"),
    intents,
    normalizedQuery: normalized,
  };
}

function locationTerms(location) {
  if (!location) {
    return new Set();
  }

  return new Set(
    [location.name, location.slug, location.country]
      .filter(Boolean)
      .flatMap((value) => normalizeQuery(value).split(" ")),
  );
}

function baseQueryTerms(query, options = {}) {
  const normalized = normalizeQuery(query);
  const cityTerms = locationTerms(options.location);
  return normalized
    .split(" ")
    .map(singularize)
    .filter((term) => term.length > 1 && !stopWords.has(term) && !cityTerms.has(term));
}

export function queryTerms(query, options = {}) {
  const baseTerms = baseQueryTerms(query, options);
  const intent = detectSearchIntent(query);
  const intentTerms = intent.intents.flatMap((intentId) => searchIntents[intentId]?.terms ?? []);
  return Array.from(
    new Set(
      [...baseTerms, ...intentTerms.map((term) => singularize(normalizeQuery(term)))]
        .filter(Boolean)
        .flatMap((term) => [
          term,
          singularize(term),
          ...(termExpansions[term] ?? []),
        ]),
    ),
  );
}

function hasBroadIntent(query) {
  const normalized = normalizeQuery(query);
  return (
    normalized.includes("things to do") ||
    normalized.includes("what to do") ||
    normalized.includes("experience") ||
    normalized.includes("experiences")
  );
}

export function distanceKm(first, second) {
  if (!first || !second) {
    return null;
  }

  const toRadians = (value) => (value * Math.PI) / 180;
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

function editDistance(first, second) {
  if (first === second) {
    return 0;
  }

  const previous = Array.from({ length: second.length + 1 }, (_, index) => index);
  const current = Array(second.length + 1).fill(0);

  for (let firstIndex = 1; firstIndex <= first.length; firstIndex += 1) {
    current[0] = firstIndex;

    for (let secondIndex = 1; secondIndex <= second.length; secondIndex += 1) {
      const cost = first[firstIndex - 1] === second[secondIndex - 1] ? 0 : 1;
      current[secondIndex] = Math.min(
        current[secondIndex - 1] + 1,
        previous[secondIndex] + 1,
        previous[secondIndex - 1] + cost,
      );
    }

    previous.splice(0, previous.length, ...current);
  }

  return previous[second.length];
}

function isFuzzyTermMatch(term, word) {
  if (term.length < 4 || word.length < 4) {
    return false;
  }

  const lengthGap = Math.abs(term.length - word.length);
  if (lengthGap > 2) {
    return false;
  }

  const allowedDistance = Math.max(term.length, word.length) >= 6 ? 2 : 1;
  return editDistance(term, word) <= allowedDistance;
}

function termMatchesText(text, term) {
  const words = text.split(" ").filter(Boolean);
  return (
    words.includes(term) ||
    words.some((word) => word.startsWith(term)) ||
    (term.length >= 4 && text.includes(term)) ||
    words.some((word) => isFuzzyTermMatch(term, word))
  );
}

function textForStrictKeywordMatch(place) {
  return textFromValues([
    place.name,
    place.title,
    place.shortDescription,
    place.description,
    place.tags,
    place.category,
    place.type,
    place.placeType,
    place.amenities,
    place.features,
    placeHasWifi(place) ? ["wifi", "wireless internet", "wlan"] : [],
    placeHasFreeWifi(place) ? ["free wifi", "complimentary wifi", "public wifi", "included wifi"] : [],
  ]);
}

function keywordAlternativesForTerm(term, allTerms = []) {
  const contextAlternatives =
    term === "shop" && allTerms.includes("coffee")
      ? ["cafe", "coffeehouse", "espresso"]
      : [];

  return Array.from(
    new Set(
      [
        term,
        singularize(term),
        ...contextAlternatives,
        ...(termExpansions[term] ?? []),
        ...(termExpansions[singularize(term)] ?? []),
      ]
        .map(normalizeQuery)
        .map(singularize)
        .filter(Boolean),
    ),
  );
}

function placeMatchesKeywordQuery(place, normalizedQuery, options = {}) {
  if (!normalizedQuery) {
    return true;
  }

  const text = textForStrictKeywordMatch(place);
  const baseTerms = baseQueryTerms(normalizedQuery, { location: options.location });

  if (text.includes(normalizedQuery)) {
    return true;
  }

  if (baseTerms.length === 0) {
    return false;
  }

  return baseTerms.every((term) =>
    keywordAlternativesForTerm(term, baseTerms).some((alternative) =>
      termMatchesText(text, alternative),
    ),
  );
}

function nameMatchTier(text, query, terms) {
  if (!text || !query) {
    return matchTiers.none;
  }

  const words = text.split(" ").filter(Boolean);

  if (text === query) {
    return matchTiers.exactName;
  }

  if (
    text.startsWith(query) ||
    (terms.length > 0 && terms.every((term) => words.some((word) => word.startsWith(term))))
  ) {
    return matchTiers.prefixName;
  }

  const matchingTerms = terms.filter((term) => termMatchesText(text, term)).length;

  if (
    text.includes(query) ||
    (terms.length === 1 && matchingTerms === 1) ||
    (terms.length > 1 && matchingTerms === terms.length)
  ) {
    return matchTiers.fuzzyName;
  }

  return matchTiers.none;
}

function scoreTerms(text, terms, points) {
  if (!text || terms.length === 0) {
    return { score: 0, tier: 0 };
  }

  const words = text.split(" ").filter(Boolean);
  let score = 0;
  let tier = 0;

  for (const term of terms) {
    if (words.includes(term)) {
      score += points.exact;
      tier = Math.max(tier, points.tier);
    } else if (words.some((word) => word.startsWith(term))) {
      score += points.prefix;
      tier = Math.max(tier, points.tier);
    } else if (term.length >= 4 && text.includes(term)) {
      score += points.partial;
      tier = Math.max(tier, Math.max(1, points.tier - 1));
    } else if (words.some((word) => isFuzzyTermMatch(term, word))) {
      score += points.fuzzy;
      tier = Math.max(tier, Math.max(1, points.tier - 1));
    }
  }

  return { score, tier };
}

function phraseScore(text, query) {
  if (!text || !query) {
    return { score: 0, tier: 0 };
  }

  if (text === query) {
    return { score: 12000, tier: 5 };
  }

  if (text.startsWith(query)) {
    return { score: 8500, tier: 4 };
  }

  if (text.includes(query)) {
    return { score: 6200, tier: 3 };
  }

  return { score: 0, tier: 0 };
}

function textFromValues(values) {
  return normalizeQuery(
    values
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value) => value !== null && value !== undefined)
      .join(" "),
  );
}

function categoryText(place) {
  return normalizeQuery([place.category, ...(categoryAliases[place.category] ?? [])].join(" "));
}

function structuredText(place) {
  return textFromValues([
    place.category,
    place.type,
    place.placeType,
    place.tags,
    place.amenities,
    place.features,
  ]);
}

function amenitiesText(place) {
  return textFromValues([place.amenities, place.features]);
}

function placeBoolean(place, names) {
  return names.some((name) => place[name] === true);
}

function placeHasWifi(place) {
  return placeBoolean(place, [
    "hasWifi",
    "has_wifi",
    "wifi",
    "wifiAvailable",
    "wifi_available",
    "hasWirelessInternet",
    "has_wireless_internet",
  ]);
}

function placeHasFreeWifi(place) {
  return placeBoolean(place, [
    "freeWifi",
    "free_wifi",
    "wifiFree",
    "wifi_free",
    "hasFreeWifi",
    "has_free_wifi",
    "publicWifi",
    "public_wifi",
    "complimentaryWifi",
    "complimentary_wifi",
    "includedWifi",
    "included_wifi",
  ]);
}

function textHasAny(text, terms) {
  return terms.some((term) => text.includes(normalizeQuery(term)));
}

function textHasFreeWifi(text) {
  const hasWifiText = textHasAny(text, ["wifi", "internet", "wlan", "hotspot"]);
  const hasFreeModifierText = textHasAny(text, [
    "free",
    "complimentary",
    "public",
    "included",
    "no cost",
  ]);
  const freeWifiPhrases = normalizedIntentPhrases(searchIntents["free-wifi"]);

  return (
    freeWifiPhrases.some((phrase) => text.includes(phrase)) ||
    (hasWifiText && hasFreeModifierText)
  );
}

function placeMatchesIntent(place, intentId) {
  const normalizedName = normalizeQuery(place.name);
  const normalizedCategory = categoryText(place);
  const normalizedStructured = structuredText(place);
  const normalizedAmenities = amenitiesText(place);
  const normalizedDescription = normalizeQuery(
    [place.shortDescription, place.description].filter(Boolean).join(" "),
  );
  const text = [
    normalizedName,
    normalizedCategory,
    normalizedStructured,
    normalizedAmenities,
    normalizedDescription,
  ].join(" ");

  if (intentId === "cafe") {
    return (
      place.category === "cafes" ||
      searchIntents.cafe.terms.some((term) => text.includes(normalizeQuery(term)))
    );
  }

  if (intentId === "wifi") {
    return (
      placeHasWifi(place) ||
      placeHasFreeWifi(place) ||
      searchIntents.wifi.terms.some((term) => text.includes(normalizeQuery(term)))
    );
  }

  if (intentId === "free-wifi") {
    return (
      placeHasFreeWifi(place) ||
      textHasFreeWifi(normalizedAmenities) ||
      textHasFreeWifi(normalizedDescription) ||
      textHasFreeWifi(text)
    );
  }

  return false;
}

export function matchesSearchIntent(place, intentId) {
  return placeMatchesIntent(place, intentId);
}

function placeDistance(place, location) {
  return distanceKm(
    { latitude: place.latitude, longitude: place.longitude },
    location,
  );
}

function placeWithinRadius(place, location, maxRadiusKm = DEFAULT_SEARCH_RADIUS_KM) {
  if (!location) {
    return true;
  }

  const distance = placeDistance(place, location);

  return distance !== null && distance <= maxRadiusKm;
}

export function compareRankedPlaces(first, second) {
  if (first.matchTier !== second.matchTier) {
    return second.matchTier - first.matchTier;
  }

  if (first.matchedTerms !== second.matchedTerms) {
    return second.matchedTerms - first.matchedTerms;
  }

  return (
    second.distanceScore - first.distanceScore ||
    first.distanceKm - second.distanceKm ||
    second.textScore - first.textScore ||
    second.popularityScore - first.popularityScore ||
    second.verifiedScore - first.verifiedScore ||
    second.freshnessScore - first.freshnessScore ||
    second.qualityScore - first.qualityScore ||
    first.index - second.index
  );
}

// Ranking is intentionally tier-first. Relevance must be established before
// distance, popularity, sponsorship, freshness, or rating can influence order.
export function rankPlaces(places, options = {}) {
  const normalizedQuery = normalizeQuery(options.query);
  const intent = detectSearchIntent(normalizedQuery);
  const baseTerms = baseQueryTerms(normalizedQuery, { location: options.location });
  const terms = queryTerms(normalizedQuery, { location: options.location });
  const hasQuery = normalizedQuery.length > 0;
  const hasCategoryFilter = Boolean(options.category && options.category !== "all");
  const broadIntent = hasBroadIntent(normalizedQuery);
  const rankLocation = options.userLocation ?? options.location ?? null;

  return places
    .map((place, index) => {
      const normalizedName = normalizeQuery(place.name);
      const normalizedTags = normalizeQuery(place.tags.join(" "));
      const normalizedAmenities = amenitiesText(place);
      const normalizedStructured = structuredText(place);
      const normalizedDescription = normalizeQuery(
        [place.shortDescription, place.description].filter(Boolean).join(" "),
      );
      const namePhrase = phraseScore(normalizedName, normalizedQuery);
      const nameTerms = scoreTerms(normalizedName, terms, {
        exact: 1200,
        prefix: 800,
        partial: 550,
        fuzzy: 550,
        tier: 3,
      });
      const categoryTerms = scoreTerms(categoryText(place), terms, {
        exact: 1100,
        prefix: 700,
        partial: 520,
        fuzzy: 550,
        tier: 4,
      });
      const tagTerms = scoreTerms(normalizedTags, terms, {
        exact: 850,
        prefix: 650,
        partial: 500,
        fuzzy: 420,
        tier: 3,
      });
      const amenityTerms = scoreTerms(normalizedAmenities, terms, {
        exact: 1000,
        prefix: 700,
        partial: 520,
        fuzzy: 420,
        tier: 3,
      });
      const descriptionTerms = scoreTerms(normalizedDescription, terms, {
        exact: 300,
        prefix: 220,
        partial: 140,
        fuzzy: 100,
        tier: 1,
      });
      const structuredCategoryValues = [place.category, place.type, place.placeType]
        .filter(Boolean)
        .map(normalizeQuery);
      const exactCategoryMatch = structuredCategoryValues.some(
        (categoryValue) => categoryValue === normalizedQuery,
      );
      const exactAmenityMatch =
        Boolean(normalizedQuery) &&
        (normalizedAmenities === normalizedQuery ||
          normalizedAmenities.includes(normalizedQuery) ||
          baseTerms.some((term) => normalizedAmenities.split(" ").includes(term)));
      const tagWords = normalizedTags.split(" ").filter(Boolean);
      const exactTagMatch =
        Boolean(normalizedQuery) &&
        (normalizedTags === normalizedQuery ||
          tagWords.includes(normalizedQuery) ||
          (baseTerms.length === 1 && tagWords.includes(baseTerms[0])) ||
          (baseTerms.length > 1 && baseTerms.every((term) => tagWords.includes(term))));
      const categoryIntentScore =
        intent.detectedCategory === place.category && !exactCategoryMatch ? 700 : 0;
      const categoryFilterScore =
        !hasQuery && hasCategoryFilter && place.category === options.category ? 1100 : 0;
      const broadIntentScore =
        broadIntent && broadIntentCategories.has(place.category) ? 460 : 0;
      const structuredWifiMatch =
        placeHasWifi(place) ||
        placeHasFreeWifi(place) ||
        textHasAny(normalizedAmenities, searchIntents.wifi.terms);
      const structuredFreeWifiMatch =
        placeHasFreeWifi(place) || textHasFreeWifi(normalizedAmenities);
      const structuredAmenityScore =
        (exactAmenityMatch ? 1000 : 0) +
        (intent.hasFreeWifiIntent && structuredFreeWifiMatch ? 1000 : 0) +
        (intent.hasFreeWifiIntent &&
        !structuredFreeWifiMatch &&
        structuredWifiMatch
          ? 700
          : 0) +
        (intent.hasWifiIntent && structuredWifiMatch ? 700 : 0);
      const cafeIntentScore =
        intent.hasCafeIntent && placeMatchesIntent(place, "cafe") ? 700 : 0;
      const freeModifierScore =
        intent.hasFreeWifiIntent && placeMatchesIntent(place, "free-wifi") ? 200 : 0;
      const nameTier = nameMatchTier(normalizedName, normalizedQuery, baseTerms);
      const exactCategoryTier = exactCategoryMatch ? matchTiers.exactCategory : matchTiers.none;
      const structuredAmenityTier =
        structuredAmenityScore > 0 ? matchTiers.structuredAmenity : matchTiers.none;
      const tagTier = exactTagMatch ? matchTiers.tag : matchTiers.none;
      const synonymCategoryAmenityTier =
        categoryTerms.tier > 0 ||
        tagTerms.tier > 0 ||
        amenityTerms.tier > 0 ||
        categoryFilterScore > 0 ||
        categoryIntentScore > 0 ||
        broadIntentScore > 0 ||
        cafeIntentScore > 0
          ? matchTiers.synonymCategoryAmenity
          : matchTiers.none;
      const descriptionTier =
        descriptionTerms.tier > 0 ? matchTiers.description : matchTiers.none;
      const matchTier = Math.max(
        nameTier,
        exactCategoryTier,
        structuredAmenityTier,
        tagTier,
        synonymCategoryAmenityTier,
        descriptionTier,
      );
      const textScore =
        namePhrase.score +
        nameTerms.score +
        categoryTerms.score +
        tagTerms.score +
        amenityTerms.score +
        descriptionTerms.score +
        categoryIntentScore +
        categoryFilterScore +
        broadIntentScore +
        structuredAmenityScore +
        cafeIntentScore +
        freeModifierScore;
      const distance = placeDistance(place, rankLocation);
      const distanceScore = distance === null ? 0 : Math.max(0, 20 - distance * 2);
      const matchedTerms = baseTerms.filter((term) =>
        [
          normalizedName,
          categoryText(place),
          normalizedTags,
          normalizedAmenities,
          normalizedStructured,
          normalizedDescription,
        ].some((text) => termMatchesText(text, term)),
      ).length;
      const popularityScore =
        typeof options.getPopularityScore === "function"
          ? Number(options.getPopularityScore(place)) || 0
          : 0;
      const verifiedScore = place.isVerified || place.verified ? 1 : 0;
      const freshnessScore = Date.parse(place.updatedAt ?? place.createdAt ?? "") || 0;
      const qualityScore =
        Math.min(place.rating ?? 0, 5) +
        (textScore > 0 || !hasQuery ? Math.min(place.sponsoredPriority, 2) : 0);
      const isRelevant =
        !hasQuery ||
        textScore > 0 ||
        intent.intents.some((intentId) => placeMatchesIntent(place, intentId)) ||
        (terms.length === 0 && (hasCategoryFilter || broadIntent));

      return {
        distanceKm: distance ?? Number.POSITIVE_INFINITY,
        distanceScore,
        index,
        isRelevant,
        matchTier,
        matchedTerms,
        place,
        popularityScore,
        verifiedScore,
        freshnessScore,
        qualityScore,
        score: textScore + distanceScore + qualityScore,
        textScore,
        tier: matchTier,
      };
    })
    .sort(compareRankedPlaces);
}

export function placeMatchesFilterId(place, filter = "all") {
  if (!filter || filter === "all") {
    return true;
  }

  if (filter === "restaurants") {
    const text = textFromValues([
      place.name,
      place.category,
      place.shortDescription,
      place.description,
      place.tags,
      place.amenities,
      place.features,
    ]);
    const broadRestaurantTerms = [
      "restaurant",
      "restaurants",
      "food",
      "cafe",
      "café",
      "dining",
      "bar",
      "mat",
      "middag",
    ].map(normalizeQuery);

    return (
      ["restaurants", "cafes", "bars"].includes(place.category) ||
      broadRestaurantTerms.some((term) => termMatchesText(text, term))
    );
  }

  if (filter === "free-wifi") {
    return placeMatchesIntent(place, "free-wifi") || placeMatchesIntent(place, "wifi");
  }

  if (filter === "rooftops") {
    const text = normalizeQuery([place.name, place.shortDescription, place.description, ...(place.tags ?? [])].join(" "));
    return text.includes("rooftop") || text.includes("roof top");
  }

  return Object.hasOwn(categoryAliases, filter) ? place.category === filter : true;
}

function placeMatchesLocation(place, location) {
  return !location || normalizeQuery(place.city) === normalizeQuery(location.name);
}

function sortRankedSearchResults(ranked, options = {}) {
  const normalizedQuery = normalizeQuery(options.query);
  const category = options.category ?? "all";
  const location = options.location ?? null;
  const sort = options.sort ?? "relevance";

  return [...ranked].sort((first, second) => {
    if (!normalizedQuery && category === "all" && !location) {
      return second.place.sponsoredPriority - first.place.sponsoredPriority;
    }

    if (sort === "popularity" && !normalizedQuery) {
      return second.popularityScore - first.popularityScore || compareRankedPlaces(first, second);
    }

    if (sort === "newest" && !normalizedQuery) {
      return (
        Date.parse(second.place.createdAt) - Date.parse(first.place.createdAt) ||
        compareRankedPlaces(first, second)
      );
    }

    return compareRankedPlaces(first, second);
  });
}

export function searchPlaceRecords(places, options = {}) {
  const normalizedQuery = normalizeQuery(options.query);
  const category = options.category ?? "all";
  const offset = Math.max(0, Math.trunc(options.offset ?? 0));
  const requestedLimit = options.limit ?? 100;
  const limit = Math.max(1, Math.min(Math.trunc(requestedLimit || 100), 250));
  const radiusLocation = options.userLocation ?? null;
  const maxRadiusKm = options.maxRadiusKm ?? DEFAULT_SEARCH_RADIUS_KM;
  const filtered = places.filter(
    (place) =>
      placeMatchesLocation(place, options.location ?? null) &&
      placeWithinRadius(place, radiusLocation, maxRadiusKm) &&
      placeMatchesFilterId(place, category) &&
      placeMatchesKeywordQuery(place, normalizedQuery, {
        location: options.location ?? null,
      }),
  );
  const ranked = rankPlaces(filtered, options).filter(
    (item) => item.isRelevant || !normalizedQuery,
  );
  const sorted = sortRankedSearchResults(ranked, {
    category,
    location: options.location ?? null,
    query: normalizedQuery,
    sort: options.sort,
  });
  const allResults = sorted.map((item) => item.place);

  return {
    limit,
    normalizedQuery,
    offset,
    ranked: sorted,
    results: allResults.slice(offset, offset + limit),
    totalCount: allResults.length,
  };
}
