import type { City } from "@/lib/types";

export const cities: City[] = [
  {
    id: "city-oslo",
    name: "Oslo",
    slug: "oslo",
    country: "Norway",
    latitude: 59.9139,
    longitude: 10.7522,
  },
  {
    id: "city-bergen",
    name: "Bergen",
    slug: "bergen",
    country: "Norway",
    latitude: 60.3913,
    longitude: 5.3221,
  },
  {
    id: "city-copenhagen",
    name: "Copenhagen",
    slug: "copenhagen",
    country: "Denmark",
    latitude: 55.6761,
    longitude: 12.5683,
  },
  {
    id: "city-barcelona",
    name: "Barcelona",
    slug: "barcelona",
    country: "Spain",
    latitude: 41.3874,
    longitude: 2.1686,
  },
  {
    id: "city-miami",
    name: "Miami",
    slug: "miami",
    country: "United States",
    latitude: 25.7617,
    longitude: -80.1918,
  },
  {
    id: "city-san-sebastian",
    name: "San Sebastián",
    slug: "san-sebastian",
    country: "Spain",
    latitude: 43.3183,
    longitude: -1.9812,
  },
  {
    id: "city-tokyo",
    name: "Tokyo",
    slug: "tokyo",
    country: "Japan",
    latitude: 35.6762,
    longitude: 139.6503,
  },
];

export const popularCities = cities.slice(0, 6);

export function normalizeLocation(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getCityBySearchTerm(value?: string | null) {
  if (!value) {
    return null;
  }

  const normalized = normalizeLocation(value);

  return (
    cities.find((city) => {
      const cityName = normalizeLocation(city.name);
      const country = normalizeLocation(city.country);

      return (
        normalized === city.slug ||
        normalized === cityName ||
        normalized.includes(city.slug) ||
        normalized.includes(cityName) ||
        normalized.includes(country)
      );
    }) ?? null
  );
}

export function getCitiesWithPlaces(placeCities: string[]) {
  const normalizedPlaceCities = new Set(placeCities.map(normalizeLocation));
  return cities.filter((city) => normalizedPlaceCities.has(normalizeLocation(city.name)));
}
