"use client";

import { Children, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type SearchResultsListProps = {
  children: ReactNode;
  pageSize?: number;
  totalCount: number;
};

export function SearchResultsList({
  children,
  pageSize = 20,
  totalCount,
}: SearchResultsListProps) {
  const items = useMemo(() => Children.toArray(children), [children]);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const visibleItems = items.slice(0, visibleCount);
  const canShowMore = visibleCount < items.length;

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {visibleItems}
      </div>
      {canShowMore ? (
        <div className="mt-6 flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setVisibleCount((current) => Math.min(current + pageSize, items.length))
            }
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-900"
          >
            Show more places
            <ChevronDown aria-hidden="true" size={16} />
          </button>
          <p className="text-xs text-slate-500">
            {Math.min(visibleCount, items.length)} of {totalCount} places listed below.
          </p>
        </div>
      ) : null}
    </div>
  );
}
