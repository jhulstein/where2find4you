import test from "node:test";
import assert from "node:assert/strict";
import { normalizeQuery, rankPlaces } from "../lib/search/ranking.js";

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

function place(overrides) {
  return {
    address: "Test address",
    category: "restaurants",
    city: "Oslo",
    country: "Norway",
    createdAt: "2026-06-08T10:00:00.000Z",
    description: "Test description",
    emailUrl: null,
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
    shortDescription: "Test short description",
    slug: overrides.id,
    source: "manual",
    sourceId: overrides.id,
    sponsoredPriority: 0,
    tags: [],
    updatedAt: "2026-06-08T10:00:00.000Z",
    websiteUrl: null,
    ...overrides,
  };
}

const records = [
  place({
    id: "waterfront-table",
    name: "Waterfront Table",
    description: "Romantic seafood dinners beside the water.",
    latitude: 59.9084,
    longitude: 10.7259,
    rating: 4.7,
    tags: ["romantic", "waterfront", "dinner", "seafood"],
  }),
  place({
    id: "quiet-corner-cafe",
    name: "Quiet Corner Café",
    category: "cafes",
    description: "Calm cafe with free WiFi and laptop-friendly seating.",
    latitude: 59.9177,
    longitude: 10.7409,
    tags: ["wifi", "coffee", "laptop", "quiet"],
  }),
  place({
    id: "fjord-hotel-lobby",
    name: "Fjord Hotel Lobby",
    category: "hotels",
    description: "Hotel lobby close to transport.",
    tags: ["hotel", "business", "lobby"],
  }),
  place({
    id: "city-view-deck",
    name: "City View Deck",
    category: "attractions",
    description: "Viewpoint and landmark for photos.",
    tags: ["viewpoint", "photos", "free"],
  }),
  place({
    id: "family-activity-hub",
    name: "Family Activity Hub",
    category: "activities",
    description: "Indoor family activities and rainy-day experiences.",
    tags: ["families", "kids", "activities"],
  }),
  place({
    id: "nordic-design-shop",
    name: "Nordic Design Shop",
    category: "shops",
    description: "Local gifts, design and souvenirs.",
    tags: ["shopping", "design", "gifts"],
  }),
  place({
    id: "aker-marina-services",
    name: "Aker Marina Services",
    category: "marinas",
    description: "Dock services for boats near the harbor.",
    tags: ["marina", "boats", "harbor"],
  }),
  place({
    id: "rooftop-north",
    name: "Rooftop North",
    category: "bars",
    description: "Rooftop cocktails and evening city views.",
    tags: ["rooftop", "bar", "cocktails"],
  }),
  place({
    id: "fjord-art-museum",
    name: "Fjord Art Museum",
    category: "museums",
    description: "Art museum with compact exhibitions.",
    tags: ["museum", "art", "culture"],
  }),
  place({
    id: "harbor-park",
    name: "Harbor Park",
    category: "parks",
    description: "Green park with outdoor walks by the water.",
    tags: ["park", "walk", "outdoors"],
  }),
  place({
    id: "visitor-bike-rental",
    name: "Visitor Bike Rental",
    category: "local-services",
    description: "Bike rental and visitor route suggestions.",
    tags: ["bike", "rental", "transport"],
  }),
  place({
    id: "fjord-kayak-rental",
    name: "Fjord Kayak Rental",
    category: "activities",
    description: "Kayak rental and guided beginner sessions.",
    tags: ["kayak", "waterfront", "activity"],
  }),
  place({
    id: "neighborhood-bakery",
    name: "Neighborhood Bakery",
    category: "cafes",
    description: "Breakfast, pastries and coffee.",
    tags: ["breakfast", "coffee", "pastries"],
  }),
  place({
    id: "bergen-fish-table",
    name: "Bergen Fish Table",
    city: "Bergen",
    description: "Seafood restaurant near Bergen harbor.",
    latitude: 60.397,
    longitude: 5.324,
    tags: ["seafood", "harbor", "dinner"],
  }),
  place({
    id: "bergen-harbor-tour",
    name: "Bergen Harbor Tour",
    category: "activities",
    city: "Bergen",
    description: "Walking tour for visitors in Bergen.",
    latitude: 60.395,
    longitude: 5.323,
    tags: ["walking-tour", "history", "families"],
  }),
];

const queryCases = [
  "quiet corner cafe",
  "quiet cornr cafe",
  "restarants oslo",
  "free wifi laptop",
  "wat",
  "roftop",
  "romantic water dinner",
  "muesum",
  "kayk rental",
  "harbr boat",
];

function topId(query, options = {}) {
  return rankPlaces(records, { location: oslo, query, ...options })
    .filter((item) => item.isRelevant)
    .at(0)?.place.id;
}

test("normalizes query whitespace, case and Wi-Fi spelling", () => {
  assert.equal(normalizeQuery("  FREE   Wi-Fi   Oslo  "), "free wifi oslo");
});

test("fixture covers at least 15 records and 10 query cases", () => {
  assert.equal(records.length >= 15, true);
  assert.equal(queryCases.length >= 10, true);
});

test("exact name search returns the exact place first", () => {
  assert.equal(topId("Quiet Corner Café"), "quiet-corner-cafe");
});

test("ranking hierarchy follows exact, structured/tag, prefix, fuzzy, description", () => {
  const hierarchyRecords = [
    place({
      id: "alpha-exact",
      name: "Alpha Place",
      description: "Generic listing.",
      tags: [],
    }),
    place({
      id: "alpha-prefix",
      name: "Alpha Place Annex",
      description: "Generic listing.",
      tags: [],
    }),
    place({
      id: "alpha-fuzzy-name",
      name: "Alph Place",
      description: "Generic listing.",
      tags: [],
    }),
    place({
      id: "alpha-tag",
      name: "Coffee Point",
      category: "cafes",
      description: "Generic listing.",
      tags: ["alpha", "place"],
    }),
    place({
      id: "alpha-description",
      name: "Quiet Desk",
      category: "local-services",
      description: "A useful alpha place for visitors.",
      tags: [],
    }),
  ];
  const ranked = rankPlaces(hierarchyRecords, {
    location: oslo,
    query: "alpha place",
  })
    .filter((item) => item.isRelevant)
    .map((item) => item.place.id);

  assert.deepEqual(ranked, [
    "alpha-exact",
    "alpha-tag",
    "alpha-prefix",
    "alpha-fuzzy-name",
    "alpha-description",
  ]);
});

test("misspelled listing search returns the likely place", () => {
  assert.equal(topId("quiet cornr cafe"), "quiet-corner-cafe");
  assert.equal(topId("neigborhood bakery"), "neighborhood-bakery");
});

test("misspelled category search still finds category matches", () => {
  assert.equal(topId("restarants oslo"), "waterfront-table");
  assert.equal(topId("muesum"), "fjord-art-museum");
});

test("category searches rank nearby relevant listings first", () => {
  const ranked = rankPlaces(records, {
    category: "restaurants",
    location: oslo,
    query: "restaurants",
  }).filter((item) => item.isRelevant);

  assert.equal(ranked[0].place.id, "waterfront-table");
  assert.equal(ranked.some((item) => item.place.id === "bergen-fish-table"), true);
});

test("multi-word tag and description queries rank the intended place first", () => {
  assert.equal(topId("free wifi laptop"), "quiet-corner-cafe");
  assert.equal(topId("romantic water dinner"), "waterfront-table");
});

test("prefix matches work for names", () => {
  assert.equal(topId("wat"), "waterfront-table");
});

test("typo-tolerant tag/category terms work", () => {
  assert.equal(topId("roftop"), "rooftop-north");
  assert.equal(topId("kayk rental"), "fjord-kayak-rental");
  assert.equal(topId("harbr boat"), "aker-marina-services");
});

test("searched location affects ranking without hiding relevant records", () => {
  const rankedNearBergen = rankPlaces(records, {
    category: "restaurants",
    location: bergen,
    query: "restaurants",
  }).filter((item) => item.isRelevant);

  assert.equal(rankedNearBergen[0].place.id, "bergen-fish-table");
  assert.equal(rankedNearBergen.some((item) => item.place.id === "waterfront-table"), true);
});
