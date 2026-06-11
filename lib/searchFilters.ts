import { categoryOptions } from "@/lib/data/places";
import { placeMatchesFilterId } from "@/lib/search/ranking";
import type { Place, PlaceCategory } from "@/lib/types";

export type SearchFilterId = "all" | "free-wifi" | "rooftops" | PlaceCategory;

export type SearchFilterOption = {
  id: SearchFilterId;
  label: string;
  description: string;
};

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
  return placeMatchesFilterId(place, filter);
}
