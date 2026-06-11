import test from "node:test";
import assert from "node:assert/strict";
import {
  detectSearchIntent,
  normalizeQuery,
  searchPlaceRecords,
} from "../lib/search/ranking.js";

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
    createdAt: "2026-06-01T10:00:00.000Z",
    description: "General visitor listing.",
    email: null,
    features: [],
    amenities: [],
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

const cafeIds = [
  "quiet-corner-cafe",
  "oslo-coffee-roasters",
  "espresso-harbor-bar",
  "nordic-kaffebar",
  "bergen-kafe",
];

const wifiIds = [
  "quiet-corner-cafe",
  "harbor-hotel-lobby",
  "library-hotspot",
  "public-work-lounge",
  "fjord-visitor-center",
];

const restaurantIds = [
  "waterfront-table",
  "fjord-dinner-house",
];

const places = [
  place({
    id: "quiet-corner-cafe",
    name: "Quiet Corner Café",
    category: "cafes",
    description: "Calm café with free WiFi, outlets and laptop-friendly seating.",
    amenities: ["free wifi", "power outlets"],
    freeWifi: true,
    hasWifi: true,
    latitude: 59.9177,
    longitude: 10.7409,
    tags: ["cafe", "coffee", "free-wifi", "quiet"],
  }),
  place({
    id: "oslo-coffee-roasters",
    name: "Oslo Coffee Roasters",
    category: "cafes",
    description: "Specialty coffee shop with pastries near the station.",
    amenities: ["coffee", "pastries"],
    latitude: 59.912,
    longitude: 10.75,
    tags: ["coffee", "coffee-shop", "breakfast"],
  }),
  place({
    id: "espresso-harbor-bar",
    name: "Espresso Harbor Bar",
    category: "cafes",
    description: "Small espresso bar with quick takeaway coffee.",
    amenities: ["espresso", "coffee"],
    latitude: 59.909,
    longitude: 10.728,
    tags: ["espresso", "coffee", "cafe"],
  }),
  place({
    id: "nordic-kaffebar",
    name: "Nordic Kaffebar",
    category: "cafes",
    description: "Kaffebar with Nordic coffee and quiet morning tables.",
    amenities: ["kaffe", "coffee"],
    latitude: 59.922,
    longitude: 10.758,
    tags: ["kaffebar", "kaffe", "coffeehouse"],
  }),
  place({
    id: "bergen-kafe",
    name: "Bergen Kafé",
    category: "cafes",
    city: "Bergen",
    description: "Local kafé and coffeehouse near the harbor.",
    amenities: ["kafe", "coffeehouse"],
    latitude: 60.392,
    longitude: 5.323,
    tags: ["kafe", "coffee", "harbor"],
  }),
  place({
    id: "harbor-hotel-lobby",
    name: "Harbor Hotel Lobby",
    category: "hotels",
    description: "Hotel lobby with wireless internet and work tables.",
    amenities: ["wireless internet", "complimentary wifi", "lobby"],
    freeWifi: true,
    hasWifi: true,
    latitude: 59.907,
    longitude: 10.756,
    tags: ["hotel", "wifi", "work"],
  }),
  place({
    id: "library-hotspot",
    name: "Library Hotspot",
    category: "local-services",
    description: "Public hotspot with internet access for visitors.",
    amenities: ["public wifi", "internet access", "wlan"],
    freeWifi: true,
    hasWifi: true,
    latitude: 59.915,
    longitude: 10.746,
    tags: ["hotspot", "wlan", "wifi"],
  }),
  place({
    id: "public-work-lounge",
    name: "Public Work Lounge",
    category: "local-services",
    description: "No-cost internet, desks and visitor information.",
    amenities: ["free internet", "work desks"],
    freeWifi: true,
    hasWifi: true,
    latitude: 59.914,
    longitude: 10.751,
    tags: ["free-internet", "work", "wifi"],
  }),
  place({
    id: "fjord-visitor-center",
    name: "Fjord Visitor Center",
    category: "local-services",
    description: "Visitor center with WLAN and maps.",
    amenities: ["wlan", "maps"],
    hasWifi: true,
    latitude: 59.906,
    longitude: 10.729,
    tags: ["visitor", "wlan", "maps"],
  }),
  place({
    id: "coffee-mentioned-bookshop",
    name: "Harbor Bookshop",
    category: "shops",
    description: "Long visitor guide that mentions coffee nearby but is not a cafe.",
    latitude: 59.915,
    longitude: 10.744,
    tags: ["books", "souvenirs"],
  }),
  place({
    id: "wifi-mentioned-gallery",
    name: "Gallery Notice Board",
    category: "museums",
    description: "A notice board says free WiFi can be found at several places nearby.",
    latitude: 59.916,
    longitude: 10.745,
    tags: ["gallery", "notice"],
  }),
  place({
    id: "waterfront-table",
    name: "Waterfront Table",
    category: "restaurants",
    description: "Romantic seafood restaurant by the water.",
    latitude: 59.908,
    longitude: 10.726,
    tags: ["restaurant", "seafood", "dinner"],
  }),
  place({
    id: "fjord-dinner-house",
    name: "Fjord Dinner House",
    category: "restaurants",
    description: "Norwegian spisested with dinner, local mat and harbor views.",
    latitude: 59.91,
    longitude: 10.731,
    tags: ["restaurant", "middag", "mat", "spisested"],
  }),
  place({
    id: "rooftop-north",
    name: "Rooftop North",
    category: "bars",
    description: "Rooftop cocktails and evening views.",
    latitude: 59.916,
    longitude: 10.75,
    tags: ["rooftop", "bar", "cocktails"],
  }),
  place({
    id: "green-harbor-park",
    name: "Green Harbor Park",
    category: "parks",
    description: "Outdoor green space with waterfront walks.",
    latitude: 59.904,
    longitude: 10.747,
    tags: ["park", "outdoors", "walk"],
  }),
];

function idsFor(query, options = {}) {
  return searchPlaceRecords(places, {
    limit: 50,
    query,
    ...options,
  }).results.map((result) => result.id);
}

test("normalizer handles accents, possessives, punctuation, plurals and WiFi variants", () => {
  assert.equal(normalizeQuery("  Café’s   Wi-Fi  "), "cafe wifi");
  assert.equal(normalizeQuery("cafes"), "cafe");
  assert.equal(normalizeQuery("free wifii"), "free wifi");
  assert.equal(normalizeQuery("no-cost internet"), "no cost internet");
});

test("cafe intent variants return all cafe and coffee-shop records", () => {
  const queries = [
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
  ];

  for (const query of queries) {
    const ids = idsFor(query);
    for (const id of cafeIds) {
      assert.equal(ids.includes(id), true, `${query} should include ${id}`);
    }
    assert.equal(ids.indexOf("waterfront-table") === -1 || ids.indexOf("waterfront-table") > 4, true);
  }
});

test("free WiFi and WiFi variants return structured WiFi places", () => {
  const queries = [
    "free WiFi",
    "wifi",
    "wi-fi",
    "wireless internet",
    "wlan",
    "free wifii",
    "complimentary wifi",
    "public wifi",
    "free internet",
    "included wifi",
  ];

  for (const query of queries) {
    const ids = idsFor(query);
    for (const id of wifiIds) {
      assert.equal(ids.includes(id), true, `${query} should include ${id}`);
    }
    assert.equal(ids.includes("waterfront-table"), false, `${query} should not include non-WiFi restaurant`);
  }
});

test("restaurant intent variants include English, Norwegian and Swedish terms", () => {
  const queries = [
    "restaurant",
    "restaurants",
    "resturant",
    "resturants",
    "restauranter",
    "restauranger",
    "restaurang",
    "spisested",
    "middag",
    "mat",
  ];

  for (const query of queries) {
    const ids = idsFor(query);
    for (const id of restaurantIds) {
      assert.equal(ids.includes(id), true, `${query} should include ${id}`);
    }
  }
});

test("ranking keeps exact name and structured matches above description-only matches", () => {
  const cafeResults = idsFor("Quiet Corner Café");
  const wifiResults = idsFor("free wifi");
  const coffeeResults = idsFor("coffee");

  assert.equal(cafeResults[0], "quiet-corner-cafe");
  assert.equal(wifiResults.slice(0, 4).includes("quiet-corner-cafe"), true);
  assert.equal(wifiResults.indexOf("harbor-hotel-lobby") < wifiResults.indexOf("fjord-visitor-center"), true);
  assert.equal(coffeeResults.indexOf("coffee-mentioned-bookshop") > 4, true);
  assert.equal(wifiResults.indexOf("wifi-mentioned-gallery") > wifiResults.indexOf("quiet-corner-cafe"), true);
  assert.equal(wifiResults.indexOf("wifi-mentioned-gallery") > wifiResults.indexOf("library-hotspot"), true);
});

test("detected intents expose category and amenity meaning", () => {
  assert.equal(detectSearchIntent("cafe’s").detectedCategory, "cafes");
  assert.equal(detectSearchIntent("kaffebar").detectedCategory, "cafes");
  assert.equal(detectSearchIntent("free wifii").hasFreeWifiIntent, true);
  assert.equal(detectSearchIntent("wlan").hasWifiIntent, true);
});

test("zero-result query stays empty", () => {
  assert.deepEqual(idsFor("volcano submarine dentist"), []);
});

test("filtered search keeps the selected category active", () => {
  const cafeWifi = idsFor("wifi", { category: "cafes" });

  assert.deepEqual(cafeWifi, ["quiet-corner-cafe"]);
});

test("paginated search keeps relevance order across pages", () => {
  const full = searchPlaceRecords(places, { query: "cafe", limit: 20, offset: 0 });
  const firstPage = searchPlaceRecords(places, { query: "cafe", limit: 2, offset: 0 });
  const secondPage = searchPlaceRecords(places, { query: "cafe", limit: 2, offset: 2 });
  const fullIds = full.results.map((result) => result.id);

  assert.equal(firstPage.totalCount >= 5, true);
  assert.deepEqual(firstPage.results.map((result) => result.id), fullIds.slice(0, 2));
  assert.deepEqual(secondPage.results.map((result) => result.id), fullIds.slice(2, 4));
  assert.equal(new Set([...firstPage.results, ...secondPage.results].map((result) => result.id)).size, 4);
});

test("location-aware search narrows and ranks by searched city", () => {
  const osloCafeIds = idsFor("cafe", { location: oslo });
  const bergenCafeIds = idsFor("cafe", { location: bergen });

  assert.equal(osloCafeIds.includes("bergen-kafe"), false);
  assert.equal(bergenCafeIds[0], "bergen-kafe");
  assert.deepEqual(bergenCafeIds, ["bergen-kafe"]);
});
