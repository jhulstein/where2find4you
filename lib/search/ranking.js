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

const categoryAliases = {
  restaurants: ["restaurant", "restaurants", "dinner", "food", "meal", "seafood"],
  cafes: ["cafe", "cafes", "café", "cafés", "coffee"],
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
  cafe: ["coffee", "wifi"],
  cafes: ["cafe", "coffee", "wifi"],
  coffee: ["cafe"],
  dinner: ["restaurant", "food"],
  food: ["restaurant", "market"],
  hotel: ["stay", "accommodation"],
  hotels: ["hotel", "stay", "accommodation"],
  kayak: ["activity", "rental"],
  marina: ["boats", "dock", "harbor"],
  marinas: ["marina", "boats", "dock", "harbor"],
  museum: ["art", "culture", "exhibition"],
  museums: ["museum", "art", "culture", "exhibition"],
  park: ["green", "walk", "outdoors"],
  parks: ["park", "green", "walk", "outdoors"],
  restaurant: ["dinner", "food", "meal"],
  restaurants: ["restaurant", "dinner", "food", "meal"],
  rooftop: ["roof", "view", "bar"],
  rooftops: ["rooftop", "roof", "view", "bar"],
  shopping: ["shop", "market", "gifts"],
  wifi: ["internet", "laptop", "work"],
};

const broadIntentCategories = new Set([
  "attractions",
  "activities",
  "parks",
  "museums",
  "local-services",
]);

const matchTiers = {
  exactName: 70,
  prefixName: 60,
  fuzzyName: 50,
  categoryTag: 40,
  description: 30,
  none: 0,
};

export function normalizeQuery(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/wi[\s-]?fi/g, "wifi")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function singularize(term) {
  if (term.endsWith("ies") && term.length > 4) {
    return `${term.slice(0, -3)}y`;
  }

  if (term.endsWith("s") && term.length > 3) {
    return term.slice(0, -1);
  }

  return term;
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
  return Array.from(
    new Set(
      baseTerms.flatMap((term) => [
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

function distanceKm(first, second) {
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
    text.includes(term) ||
    words.some((word) => isFuzzyTermMatch(term, word))
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
    } else if (text.includes(term)) {
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

function categoryText(place) {
  return normalizeQuery([place.category, ...(categoryAliases[place.category] ?? [])].join(" "));
}

function placeDistance(place, location) {
  return distanceKm(
    { latitude: place.latitude, longitude: place.longitude },
    location,
  );
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

// Ranking order is intentionally tier-first:
// exact name > name prefix > fuzzy name > category/tag > description >
// nearby distance > popularity/verified/freshness tie-breakers.
export function rankPlaces(places, options = {}) {
  const normalizedQuery = normalizeQuery(options.query);
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
      const normalizedDescription = normalizeQuery(
        [place.shortDescription, place.description].filter(Boolean).join(" "),
      );
      const namePhrase = phraseScore(normalizedName, normalizedQuery);
      const nameTerms = scoreTerms(normalizedName, terms, {
        exact: 900,
        prefix: 680,
        partial: 460,
        fuzzy: 380,
        tier: 3,
      });
      const categoryTerms = scoreTerms(categoryText(place), terms, {
        exact: 720,
        prefix: 560,
        partial: 400,
        fuzzy: 320,
        tier: 2,
      });
      const tagTerms = scoreTerms(normalizedTags, terms, {
        exact: 680,
        prefix: 520,
        partial: 360,
        fuzzy: 280,
        tier: 2,
      });
      const descriptionTerms = scoreTerms(normalizedDescription, terms, {
        exact: 300,
        prefix: 220,
        partial: 140,
        fuzzy: 100,
        tier: 1,
      });
      const categoryFilterScore =
        hasCategoryFilter && place.category === options.category ? 520 : 0;
      const broadIntentScore =
        broadIntent && broadIntentCategories.has(place.category) ? 460 : 0;
      const nameTier = nameMatchTier(normalizedName, normalizedQuery, baseTerms);
      const categoryTagTier =
        categoryTerms.tier > 0 ||
        tagTerms.tier > 0 ||
        categoryFilterScore > 0 ||
        broadIntentScore > 0
          ? matchTiers.categoryTag
          : matchTiers.none;
      const descriptionTier =
        descriptionTerms.tier > 0 ? matchTiers.description : matchTiers.none;
      const matchTier = Math.max(nameTier, categoryTagTier, descriptionTier);
      const textScore =
        namePhrase.score +
        nameTerms.score +
        categoryTerms.score +
        tagTerms.score +
        descriptionTerms.score +
        categoryFilterScore +
        broadIntentScore;
      const distance = placeDistance(place, rankLocation);
      const distanceScore = distance === null ? 0 : Math.max(0, 360 - distance * 35);
      const matchedTerms = baseTerms.filter((term) =>
        [
          normalizedName,
          categoryText(place),
          normalizedTags,
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
        (place.rating ?? 0) * 8 +
        (textScore > 0 || !hasQuery ? Math.min(place.sponsoredPriority, 3) : 0);
      const isRelevant =
        !hasQuery ||
        textScore > 0 ||
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
