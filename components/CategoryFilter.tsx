import Link from "next/link";
import { searchFilterOptions, type SearchFilterId } from "@/lib/searchFilters";

type CategoryFilterProps = {
  activeCategory?: SearchFilterId;
  location?: string;
  query?: string;
  sort?: string;
};

export function CategoryFilter({
  activeCategory = "all",
  location,
  query = "",
  sort = "relevance",
}: CategoryFilterProps) {
  function hrefFor(categoryId: SearchFilterId) {
    const searchParams = new URLSearchParams();

    if (query) {
      searchParams.set("q", query);
    }
    if (location) {
      searchParams.set("location", location);
    }
    searchParams.set("category", categoryId);
    searchParams.set("sort", sort);

    return `/search?${searchParams.toString()}`;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {searchFilterOptions.map((category) => {
        const href = hrefFor(category.id);
        const isActive = activeCategory === category.id;

        return (
          <Link
            key={category.id}
            href={href}
            className={`shrink-0 rounded-full border px-3 py-2 text-sm font-medium transition ${
              isActive
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50"
            }`}
          >
            {category.label}
          </Link>
        );
      })}
    </div>
  );
}
