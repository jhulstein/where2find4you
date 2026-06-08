"use client";

import { Clock3, Laptop, Mountain, Star, Volume2, Wifi } from "lucide-react";

export type FilterId =
  | "free-wifi"
  | "laptop-friendly"
  | "quiet"
  | "open-now"
  | "high-score"
  | "rooftop";

type FilterBarProps = {
  activeFilters: FilterId[];
  onToggle: (filter: FilterId) => void;
};

const filters: Array<{
  id: FilterId;
  label: string;
  icon: typeof Wifi;
}> = [
  { id: "free-wifi", label: "Free WiFi", icon: Wifi },
  { id: "laptop-friendly", label: "Laptop friendly", icon: Laptop },
  { id: "quiet", label: "Quiet", icon: Volume2 },
  { id: "open-now", label: "Open now", icon: Clock3 },
  { id: "high-score", label: "High score", icon: Star },
  { id: "rooftop", label: "Rooftop", icon: Mountain },
];

export function FilterBar({ activeFilters, onToggle }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const Icon = filter.icon;
        const isActive = activeFilters.includes(filter.id);

        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onToggle(filter.id)}
            aria-pressed={isActive}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "border-teal-700 bg-teal-700 text-white"
                : "border-stone-200 bg-white text-stone-700 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-950"
            }`}
          >
            <Icon aria-hidden="true" size={16} />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
