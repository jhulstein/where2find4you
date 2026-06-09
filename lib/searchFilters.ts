import { categoryOptions } from "@/lib/data/places";
import type { Place, PlaceCategory } from "@/lib/types";

export type SearchFilterId = "all" | "free-wifi" | "rooftops" | PlaceCategory;

export type SearchFilterOption = {
  id: SearchFilterId;
  label: string;
  description: string;
};

const placeCategoryIds = new Set(categoryOptions.map((category) => category.id));

export const searchFilterOptions: SearchFilterOption[] = [
  {
    id: "free-wifi",
    label: "FREE WiFi",
    description: "Places where free Wi-Fi is part of the discovery signal.",
  },
  {
    id: "rooftops",
    label: "Rooftops",
    description: "Rooftop spots, views and elevated evening places.",
  },
  ...categoryOptions,
  {
    id: "all",
    label: "All",
    description: "Show all matching places.",
  },
];

export function normalizeSearchFilter(value: string | undefined): SearchFilterId {
  if (value && searchFilterOptions.some((option) => option.id === value)) {
    return value as SearchFilterId;
  }

  return "all";
}

export function matchesSearchFilter(place: Place, filter: SearchFilterId) {
  if (filter === "all") {
    return true;
  }

  if (filter === "free-wifi") {
    const text = [place.name, place.shortDescription, place.description, ...place.tags]
      .join(" ")
      .toLowerCase();
    return text.includes("wifi") || text.includes("wi-fi") || text.includes("free-wifi");
  }

  if (filter === "rooftops") {
    const text = [place.name, place.shortDescription, place.description, ...place.tags]
      .join(" ")
      .toLowerCase();
    return text.includes("rooftop") || text.includes("roof top");
  }

  if (placeCategoryIds.has(filter)) {
    return place.category === filter;
  }

  return true;
}
