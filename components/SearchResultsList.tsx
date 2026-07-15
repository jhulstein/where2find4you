"use client";

import { Children, Fragment, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type SearchResultsListProps = {
  children: ReactNode;
  inlineAd?: ReactNode;
  inlineAdAfter?: number;
  pageSize?: number;
  totalCount: number;
};

export function SearchResultsList({
  children,
  inlineAd,
  inlineAdAfter = 6,
  pageSize = 20,
  totalCount,
}: SearchResultsListProps) {
  const items = useMemo(() => Children.toArray(children), [children]);
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const visibleItems = items.slice(0, visibleCount);
  const canShowMore = visibleCount < items.length;
  const shouldShowInlineAd = Boolean(inlineAd) && items.length >= 4;
  const inlineAdIndex = Math.min(inlineAdAfter, visibleItems.length) - 1;

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {visibleItems.map((item, index) => (
          <Fragment key={`result-${index}`}>
            {item}
            {shouldShowInlineAd && index === inlineAdIndex ? (
              <div className="md:col-span-2 xl:col-span-3 2xl:col-span-4">
                {inlineAd}
              </div>
            ) : null}
          </Fragment>
        ))}
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
