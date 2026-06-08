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
    id: "city-tokyo",
    name: "Tokyo",
    slug: "tokyo",
    country: "Japan",
    latitude: 35.6762,
    longitude: 139.6503,
  },
];

export const popularCities = cities;
