import test from "node:test";
import assert from "node:assert/strict";
import { compareRankedPlaces, normalizeQuery, rankPlaces } from "../lib/search/ranking.js";

const oslo = {
  id: "city-oslo",
  name: "Oslo",
  slug: "oslo",
  country: "Norway",
  latitude: 59.9139,
  longitude: 10.7522,
};

const bergen = {
  id: "city-bergen",
  name: "Bergen",
  slug: "bergen",
  country: "Norway",
  latitude: 60.3913,
  longitude: 5.3221,
};

const copenhagen = {
  id: "city-copenhagen",
  name: "Copenhagen",
  slug: "copenhagen",
  country: "Denmark",
  latitude: 55.6761,
  longitude: 12.5683,
};

function place(overrides) {
  return {
    address: "Test address",
    category: "restaurants",
    city: "Oslo",
    country: "Norway",
    createdAt: "2026-06-01T10:00:00.000Z",
    description: "General visitor listing.",
    email: null,
    id: overrides.id,
    imageUrl: null,
    isActive: true,
    isSponsored: false,
    latitude: 59.9139,
    longitude: 10.7522,
    name: overrides.name,
    openingHours: "Hours not provided",
    phone: null,
    rating: 4,
    shortDescription: "Useful local place.",
    slug: overrides.id,
    source: "manual",
    sourceId: overrides.id,
    sponsoredPriority: 0,
    tags: [],
    updatedAt: "2026-06-01T10:00:00.000Z",
    websiteUrl: null,
    ...overrides,
  };
}

const fixturePlaces = [
  place({
    id: "quiet-corner-cafe",
    name: "Quiet Corner Café",
    category: "cafes",
    description: "Calm cafe with free WiFi, coffee, outlets and laptop-friendly tables.",
    shortDescription: "Quiet cafe with reliable free WiFi.",
    tags: ["free-wifi", "coffee", "quiet", "laptop-friendly"],
    latitude: 59.9177,
    longitude: 10.7409,
    rating: 4.8,
  }),
  place({
    id: "waterfront-table",
    name: "Waterfront Table",
    category: "restaurants",
    description: "Romantic seafood restaurant beside the Oslo waterfront.",
    shortDescription: "Waterfront seafood dining.",
    tags: ["romantic", "waterfront", "seafood", "dinner"],
    latitude: 59.9084,
    longitude: 10.7259,
    rating: 4.7,
  }),
  place({
    id: "fjord-hotel-lobby",
    name: "Fjord Hotel Lobby",
    category: "hotels",
    description: "Hotel lobby with work desks near central transport.",
    shortDescription: "Work-friendly hotel lobby.",
    tags: ["hotel", "business", "lobby", "wifi"],
    latitude: 59.911,
    longitude: 10.755,
  }),
  place({
    id: "rooftop-north",
    name: "Rooftop North",
    category: "bars",
    description: "Rooftop cocktails with evening city views.",
    shortDescription: "Rooftop bar with views.",
    tags: ["rooftop", "cocktails", "views", "bar"],
    latitude: 59.913,
    longitude: 10.752,
  }),
  place({
    id: "fjord-art-museum",
    name: "Fjord Art Museum",
    category: "museums",
    description: "Compact art museum and culture exhibitions near the harbor.",
    shortDescription: "Art and culture museum.",
    tags: ["museum", "art", "culture", "exhibition"],
    latitude: 59.906,
    longitude: 10.73,
  }),
  place({
    id: "aker-marina-services",
    name: "Aker Marina Services",
    category: "marinas",
    description: "Marina, dock support and boat services near the harbor.",
    shortDescription: "Boat and dock services.",
    tags: ["marina", "boats", "dock", "harbor"],
    latitude: 59.907,
    longitude: 10.722,
  }),
  place({
    id: "family-activity-hub",
    name: "Family Activity Hub",
    category: "activities",
    description: "Indoor family activities, rainy-day games and visitor experiences.",
    shortDescription: "Family activities for kids.",
    tags: ["family", "kids", "activities", "rainy-day"],
    latitude: 59.916,
    longitude: 10.76,
  }),
  place({
    id: "harbor-park",
    name: "Harbor Park",
    category: "parks",
    description: "Green outdoor walks beside the water.",
    shortDescription: "Waterfront park and walks.",
    tags: ["park", "outdoors", "walk", "green"],
    latitude: 59.903,
    longitude: 10.71,
  }),
  place({
    id: "nordic-design-shop",
    name: "Nordic Design Shop",
    category: "shops",
    description: "Local design, gifts, souvenirs and small homewares.",
    shortDescription: "Design gifts and souvenirs.",
    tags: ["shopping", "design", "gifts", "souvenirs"],
    latitude: 59.914,
    longitude: 10.746,
  }),
  place({
    id: "visitor-bike-rental",
    name: "Visitor Bike Rental",
    category: "local-services",
    description: "Bike rental with local route suggestions.",
    shortDescription: "Bike rental for visitors.",
    tags: ["bike", "rental", "transport", "visitor"],
    latitude: 59.912,
    longitude: 10.748,
  }),
  place({
    id: "fjord-kayak-rental",
    name: "Fjord Kayak Rental",
    category: "activities",
    description: "Kayak rental and beginner paddling sessions on the fjord.",
    shortDescription: "Kayak rental by the water.",
    tags: ["kayak", "rental", "waterfront", "activity"],
    latitude: 59.9,
    longitude: 10.71,
  }),
  place({
    id: "oslo-coffee-roasters",
    name: "Oslo Coffee Roasters",
    category: "cafes",
    description: "Specialty coffee and pastries near the station.",
    shortDescription: "Specialty coffee bar.",
    tags: ["coffee", "pastries", "breakfast"],
    latitude: 59.912,
    longitude: 10.75,
  }),
  place({
    id: "bergen-fish-table",
    name: "Bergen Fish Table",
    category: "restaurants",
    city: "Bergen",
    description: "Seafood restaurant near Bergen harbor.",
    shortDescription: "Bergen seafood restaurant.",
    tags: ["seafood", "harbor", "dinner"],
    latitude: 60.397,
    longitude: 5.324,
  }),
  place({
    id: "bergen-harbor-tour",
    name: "Bergen Harbor Tour",
    category: "activities",
    city: "Bergen",
    description: "Walking tour for visitors in Bergen harbor.",
    shortDescription: "Bergen harbor walking tour.",
    tags: ["walking-tour", "history", "family"],
    latitude: 60.395,
    longitude: 5.323,
  }),
  place({
    id: "copenhagen-harbor-bikes",
    name: "Copenhagen Harbor Bikes",
    category: "local-services",
    city: "Copenhagen",
    country: "Denmark",
    description: "Bike rental near Copenhagen harbor.",
    shortDescription: "Copenhagen bike rental.",
    tags: ["bike", "rental", "harbor"],
    latitude: 55.678,
    longitude: 12.59,
  }),
];

function placeMatchesCategory(place, category) {
  return category === "all" || place.category === category;
}

function placeMatchesLocation(place, location) {
  return !location || normalizeQuery(place.city) === normalizeQuery(location.name);
}

function runSearch({
  category = "all",
  location = null,
  page = 1,
  pageSize = 5,
  places = fixturePlaces,
  query = "",
  userLocation = null,
} = {}) {
  const filtered = places.filter(
    (item) => placeMatchesCategory(item, category) && placeMatchesLocation(item, location),
  );
  const ranked = rankPlaces(filtered, {
    category,
    location,
    query,
    userLocation,
  })
    .filter((item) => item.isRelevant || !normalizeQuery(query))
    .sort(compareRankedPlaces);
  const start = (page - 1) * pageSize;

  return {
    ids: ranked.slice(start, start + pageSize).map((item) => item.place.id),
    total: ranked.length,
  };
}

test("fixture is realistic enough for relevance regression coverage", () => {
  assert.equal(fixturePlaces.length >= 15, true);
  assert.equal(new Set(fixturePlaces.map((item) => item.category)).size >= 9, true);
  assert.equal(new Set(fixturePlaces.map((item) => item.city)).size >= 3, true);
});

test("exact match ranks the exact listing first", () => {
  assert.equal(runSearch({ query: "Quiet Corner Café" }).ids[0], "quiet-corner-cafe");
});

test("typo match still returns the likely listing first", () => {
  assert.equal(runSearch({ query: "quiet cornr cafe" }).ids[0], "quiet-corner-cafe");
  assert.equal(runSearch({ query: "muesum" }).ids[0], "fjord-art-museum");
});

test("partial match ranks name prefix and partial names above weaker matches", () => {
  assert.equal(runSearch({ query: "waterfr" }).ids[0], "waterfront-table");
  assert.equal(runSearch({ query: "rooft" }).ids[0], "rooftop-north");
});

test("category search returns category-relevant places first", () => {
  const result = runSearch({ category: "restaurants", location: oslo, query: "restaurants" });

  assert.equal(result.ids[0], "waterfront-table");
  assert.deepEqual(result.ids, ["waterfront-table"]);
});

test("tag search finds places through tags, not just names", () => {
  assert.equal(runSearch({ location: oslo, query: "free wifi laptop" }).ids[0], "quiet-corner-cafe");
  assert.equal(runSearch({ location: oslo, query: "boat dock harbor" }).ids[0], "aker-marina-services");
});

test("multi-word search respects combined intent", () => {
  assert.equal(runSearch({ location: oslo, query: "romantic seafood waterfront" }).ids[0], "waterfront-table");
  assert.equal(runSearch({ location: oslo, query: "family rainy day activities" }).ids[0], "family-activity-hub");
});

test("location-aware search ranks nearby matching places first", () => {
  assert.equal(
    runSearch({ category: "restaurants", location: bergen, query: "restaurants" }).ids[0],
    "bergen-fish-table",
  );
  assert.equal(
    runSearch({ category: "local-services", location: copenhagen, query: "bike rental" }).ids[0],
    "copenhagen-harbor-bikes",
  );
});

test("zero-result query returns no matches", () => {
  const result = runSearch({ location: oslo, query: "volcano submarine dentist" });

  assert.equal(result.total, 0);
  assert.deepEqual(result.ids, []);
});

test("filtered search keeps category and city filters active", () => {
  const cafeResult = runSearch({ category: "cafes", location: oslo, query: "wifi" });
  const bergenCafeResult = runSearch({ category: "cafes", location: bergen, query: "wifi" });

  assert.deepEqual(cafeResult.ids, ["quiet-corner-cafe", "oslo-coffee-roasters"]);
  assert.deepEqual(bergenCafeResult.ids, []);
});

test("pagination preserves relevance order across pages", () => {
  const paginationPlaces = [
    place({
      id: "bike-rental-central",
      name: "Bike Rental Central",
      category: "local-services",
      tags: ["bike", "rental"],
    }),
    place({
      id: "bike-rental-waterfront",
      name: "Bike Rental Waterfront",
      category: "local-services",
      latitude: 59.91,
      longitude: 10.73,
      tags: ["bike", "rental", "waterfront"],
    }),
    place({
      id: "bike-rental-family",
      name: "Bike Rental Family",
      category: "local-services",
      latitude: 59.92,
      longitude: 10.76,
      tags: ["bike", "rental", "family"],
    }),
    place({
      id: "bike-rental-late-night",
      name: "Bike Rental Late Night",
      category: "local-services",
      latitude: 59.93,
      longitude: 10.77,
      tags: ["bike", "rental", "late-night"],
    }),
    place({
      id: "quiet-cafe-control",
      name: "Quiet Cafe Control",
      category: "cafes",
      tags: ["coffee"],
    }),
  ];
  const firstPage = runSearch({
    location: oslo,
    page: 1,
    pageSize: 2,
    places: paginationPlaces,
    query: "bike rental",
  });
  const secondPage = runSearch({
    location: oslo,
    page: 2,
    pageSize: 2,
    places: paginationPlaces,
    query: "bike rental",
  });
  const thirdPage = runSearch({
    location: oslo,
    page: 3,
    pageSize: 2,
    places: paginationPlaces,
    query: "bike rental",
  });

  assert.equal(firstPage.total, 4);
  assert.deepEqual(firstPage.ids, ["bike-rental-central", "bike-rental-family"]);
  assert.deepEqual(secondPage.ids, ["bike-rental-waterfront", "bike-rental-late-night"]);
  assert.deepEqual(thirdPage.ids, []);
});
