import test from "node:test";
import assert from "node:assert/strict";
import {
  buildTypesenseSearchParameters,
  createTypesensePlaceDocument,
  placeFromTypesenseDocument,
  typesensePlacesSchema,
  typesenseSynonyms,
} from "../lib/search/typesenseCore.js";

const oslo = {
  id: "city-oslo",
  name: "Oslo",
  slug: "oslo",
  country: "Norway",
  latitude: 59.9139,
  longitude: 10.7522,
};

const quietCafe = {
  address: "Universitetsgata 8",
  amenities: ["Free Wi-Fi", "Power outlets"],
  category: "cafes",
  city: "Oslo",
  country: "Norway",
  createdAt: "2026-06-08T10:00:00.000Z",
  description: "Calm café with complimentary wifi and laptop-friendly seating.",
  email: null,
  features: ["quiet tables"],
  freeWifi: true,
  hasWifi: true,
  id: "pl-quiet-corner-cafe",
  imageUrl: null,
  isActive: true,
  isSponsored: false,
  isVerified: true,
  latitude: 59.9177,
  longitude: 10.7409,
  name: "Quiet Corner Café",
  openingHours: "Open daily",
  phone: null,
  rating: 4.5,
  shortDescription: "Quiet café with Wi-Fi.",
  slug: "quiet-corner-cafe",
  source: "manual",
  sourceId: "manual-quiet-corner-cafe",
  sponsoredPriority: 0,
  tags: ["coffee", "wifi", "laptop"],
  updatedAt: "2026-06-09T10:00:00.000Z",
  websiteUrl: "https://example.com",
};

test("Typesense schema indexes searchable, filterable, sortable and geo fields", () => {
  const fields = new Map(typesensePlacesSchema.fields.map((field) => [field.name, field]));

  assert.equal(fields.get("name")?.type, "string");
  assert.equal(fields.get("category")?.facet, true);
  assert.equal(fields.get("tags")?.facet, true);
  assert.equal(fields.get("amenities")?.facet, true);
  assert.equal(fields.get("city")?.facet, true);
  assert.equal(fields.get("location")?.type, "geopoint");
  assert.equal(fields.get("rating")?.sort, true);
  assert.equal(fields.get("popularity")?.sort, true);
  assert.equal(fields.get("updatedAt")?.sort, true);
  assert.equal(fields.get("freeWifi")?.facet, true);
});

test("Typesense document normalizes names, categories, tags, amenities and WiFi booleans", () => {
  const document = createTypesensePlaceDocument(quietCafe, { popularity: 42 });

  assert.equal(document.recordId, quietCafe.id);
  assert.equal(document.normalizedName, "quiet corner cafe");
  assert.equal(document.normalizedCategory, "cafe");
  assert.equal(document.categoryAliases.includes("coffee shop"), true);
  assert.equal(document.normalizedTags.includes("coffee"), true);
  assert.equal(document.normalizedAmenities.includes("free wifi"), true);
  assert.equal(document.hasWifi, true);
  assert.equal(document.freeWifi, true);
  assert.equal(document.publicWifi, false);
  assert.deepEqual(document.location, [quietCafe.latitude, quietCafe.longitude]);
  assert.equal(document.popularity, 42);
  assert.equal(document.verified, true);
  assert.equal(document.openNow, true);
});

test("Typesense query builder applies normalization, field priorities and WiFi intent filters", () => {
  const parameters = buildTypesenseSearchParameters({
    category: "all",
    location: oslo,
    offset: 0,
    pageSize: 20,
    query: " free  wifii ",
    radiusKm: 15,
    sort: "relevance",
    userLocation: oslo,
  });

  assert.equal(parameters.q, "free wifi");
  assert.match(parameters.query_by, /normalizedName/);
  assert.match(parameters.query_by, /normalizedAmenities/);
  assert.match(parameters.query_by_weights, /^14,13,12/);
  assert.match(parameters.filter_by, /isActive:=true/);
  assert.match(parameters.filter_by, /city:=`Oslo`/);
  assert.match(parameters.filter_by, /location:\(59\.9139, 10\.7522, 15 km\)/);
  assert.match(parameters.filter_by, /freeWifi:=true/);
  assert.match(parameters.sort_by, /^_text_match:desc/);
  assert.match(parameters.sort_by, /location\(59\.9139, 10\.7522\):asc/);
  assert.equal(parameters.num_typos, "2");
  assert.equal(parameters.prefix, "true");
});

test("Typesense query builder preserves filters and pagination", () => {
  const parameters = buildTypesenseSearchParameters({
    category: "restaurants",
    offset: 40,
    pageSize: 20,
    query: "restauranger",
  });

  assert.equal(parameters.q, "restauranger");
  assert.match(parameters.filter_by, /category:=`restaurants`/);
  assert.equal(parameters.page, "3");
  assert.equal(parameters.per_page, "20");
});

test("Typesense synonyms include critical cafe, wifi and restaurant variants", () => {
  const allSynonyms = typesenseSynonyms.flatMap((synonym) => synonym.synonyms);

  for (const value of [
    "cafe",
    "cafe",
    "coffee shop",
    "kafe",
    "kaffebar",
    "free wifi",
    "wireless internet",
    "wlan",
    "restauranger",
    "restauranter",
  ]) {
    assert.equal(allSynonyms.includes(value), true, `${value} should be a Typesense synonym`);
  }
});

test("Typesense documents map back to renderable Place records", () => {
  const document = createTypesensePlaceDocument(quietCafe);
  const place = placeFromTypesenseDocument(document);

  assert.equal(place.id, quietCafe.id);
  assert.equal(place.name, quietCafe.name);
  assert.equal(place.category, quietCafe.category);
  assert.equal(place.freeWifi, true);
  assert.equal(place.hasWifi, true);
  assert.equal(place.isVerified, true);
  assert.deepEqual(place.tags, quietCafe.tags);
});
