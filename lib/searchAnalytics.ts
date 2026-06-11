import { activePlaces, categoryOptions } from "@/lib/data/places";
import { cities } from "@/lib/data/cities";
import { normalizeQuery } from "@/lib/search/ranking";
import { placeClicks, searches } from "@/lib/tracking";
import type { SearchRecord } from "@/lib/types";

type QueryGroup = {
  count: number;
  filtersUsed: SearchRecord["filtersUsed"];
  lastCreatedAt: string;
  normalizedQuery: string;
  query: string;
  resultCount: number;
};

function displayQuery(search: SearchRecord) {
  return search.query === "all places" && search.normalizedQuery
    ? search.normalizedQuery
    : search.query;
}

function groupSearches(items: SearchRecord[], getKey: (search: SearchRecord) => string) {
  const groups = new Map<string, QueryGroup>();

  for (const search of items) {
    const key = getKey(search);
    const existing = groups.get(key);

    if (existing) {
      existing.count += 1;
      existing.resultCount += search.resultCount;

      if (Date.parse(search.createdAt) > Date.parse(existing.lastCreatedAt)) {
        existing.filtersUsed = search.filtersUsed;
        existing.lastCreatedAt = search.createdAt;
        existing.query = displayQuery(search);
      }

      continue;
    }

    groups.set(key, {
      count: 1,
      filtersUsed: search.filtersUsed,
      lastCreatedAt: search.createdAt,
      normalizedQuery: search.normalizedQuery,
      query: displayQuery(search),
      resultCount: search.resultCount,
    });
  }

  return Array.from(groups.values()).sort(
    (a, b) => b.count - a.count || Date.parse(b.lastCreatedAt) - Date.parse(a.lastCreatedAt),
  );
}

function singularize(term: string) {
  if (term.endsWith("ies") && term.length > 4) {
    return `${term.slice(0, -3)}y`;
  }

  if (term.endsWith("s") && term.length > 3) {
    return term.slice(0, -1);
  }

  return term;
}

function editDistance(first: string, second: string) {
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

function buildVocabulary() {
  const values = [
    ...cities.flatMap((city) => [city.name, city.slug, city.country]),
    ...categoryOptions.flatMap((category) => [category.id, category.label]),
    ...activePlaces.flatMap((place) => [
      place.name,
      place.category,
      place.city,
      place.country,
      ...place.tags,
    ]),
  ];
  const terms = values
    .flatMap((value) => normalizeQuery(value).split(" "))
    .map(singularize)
    .filter((term) => term.length >= 4);

  return Array.from(new Set(terms));
}

function getTermEntries() {
  const entries = new Map<string, { count: number; examples: Set<string> }>();

  for (const search of searches) {
    for (const term of normalizeQuery(search.normalizedQuery || search.query).split(" ").filter(Boolean)) {
      const normalizedTerm = singularize(term);

      if (normalizedTerm.length < 3) {
        continue;
      }

      const entry = entries.get(normalizedTerm) ?? { count: 0, examples: new Set<string>() };
      entry.count += 1;
      entry.examples.add(displayQuery(search));
      entries.set(normalizedTerm, entry);
    }
  }

  return entries;
}

function repeatedTerms() {
  const repeats = new Map<string, { count: number; examples: Set<string> }>();

  for (const search of searches) {
    const terms = normalizeQuery(search.normalizedQuery || search.query).split(" ").filter(Boolean);
    const termCounts = terms.reduce<Record<string, number>>((accumulator, term) => {
      const normalizedTerm = singularize(term);
      accumulator[normalizedTerm] = (accumulator[normalizedTerm] ?? 0) + 1;
      return accumulator;
    }, {});

    for (const [term, count] of Object.entries(termCounts)) {
      if (count < 2 || term.length < 3) {
        continue;
      }

      const entry = repeats.get(term) ?? { count: 0, examples: new Set<string>() };
      entry.count += count;
      entry.examples.add(displayQuery(search));
      repeats.set(term, entry);
    }
  }

  return Array.from(repeats.entries())
    .map(([term, entry]) => ({
      term,
      count: entry.count,
      examples: Array.from(entry.examples).slice(0, 3),
    }))
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, 10);
}

function possibleMisspellings() {
  const vocabulary = buildVocabulary();
  const terms = getTermEntries();

  return Array.from(terms.entries())
    .flatMap(([term, entry]) => {
      if (vocabulary.includes(term) || term.length < 4) {
        return [];
      }

      const nearest = vocabulary
        .map((candidate) => ({ candidate, distance: editDistance(term, candidate) }))
        .filter(({ distance }) => distance > 0 && distance <= (term.length >= 6 ? 2 : 1))
        .sort((a, b) => a.distance - b.distance || a.candidate.length - b.candidate.length)[0];

      if (!nearest) {
        return [];
      }

      return [
        {
          term,
          suggestion: nearest.candidate,
          count: entry.count,
          examples: Array.from(entry.examples).slice(0, 3),
        },
      ];
    })
    .sort((a, b) => b.count - a.count || a.term.localeCompare(b.term))
    .slice(0, 10);
}

export function getSearchAnalyticsReport() {
  const clickedSearchIds = new Set(
    placeClicks.map((click) => click.searchId).filter((searchId): searchId is string => Boolean(searchId)),
  );
  const searchesWithLatency = searches.filter((search) => typeof search.latencyMs === "number");
  const averageLatencyMs =
    searchesWithLatency.length > 0
      ? Math.round(
          searchesWithLatency.reduce((total, search) => total + (search.latencyMs ?? 0), 0) /
            searchesWithLatency.length,
        )
      : null;

  return {
    totalSearches: searches.length,
    clickedSearches: clickedSearchIds.size,
    locationAvailableSearches: searches.filter((search) => search.userLocationAvailable).length,
    averageLatencyMs,
    topZeroResultSearches: groupSearches(
      searches.filter((search) => search.resultCount === 0),
      (search) => search.normalizedQuery || search.query,
    ).slice(0, 10),
    topSearchesWithNoClicks: groupSearches(
      searches.filter((search) => search.resultCount > 0 && !clickedSearchIds.has(search.id)),
      (search) => search.normalizedQuery || search.query,
    ).slice(0, 10),
    slowestSearches: [...searchesWithLatency]
      .sort((a, b) => (b.latencyMs ?? 0) - (a.latencyMs ?? 0))
      .slice(0, 10)
      .map((search) => ({
        query: displayQuery(search),
        normalizedQuery: search.normalizedQuery,
        resultCount: search.resultCount,
        latencyMs: search.latencyMs ?? 0,
        filtersUsed: search.filtersUsed,
        createdAt: search.createdAt,
      })),
    repeatedTerms: repeatedTerms(),
    possibleMisspellings: possibleMisspellings(),
  };
}
