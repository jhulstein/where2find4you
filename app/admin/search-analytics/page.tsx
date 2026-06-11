import { MapPin, MousePointerClick, Search, Timer } from "lucide-react";
import { AdminNav } from "@/components/AdminNav";
import { AdminTable } from "@/components/AdminTable";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { StatsCard } from "@/components/StatsCard";
import { getSearchAnalyticsReport } from "@/lib/searchAnalytics";
import type { JsonValue } from "@/lib/types";

function formatFilters(filters: Record<string, JsonValue>) {
  const values = Object.entries(filters)
    .filter(([, value]) => value !== null && value !== "" && value !== "all")
    .map(([key, value]) => `${key}: ${String(value)}`);

  return values.length > 0 ? values.join(", ") : "None";
}

function formatExamples(examples: string[]) {
  return examples.length > 0 ? examples.join(", ") : "None";
}

function rowsOrEmpty(rows: Array<Array<string | number>>) {
  return rows.length > 0 ? rows : [["No data yet", "", "", ""]];
}

export default function AdminSearchAnalyticsPage() {
  const report = getSearchAnalyticsReport();

  return (
    <main>
      <ResponsiveContainer className="py-6 sm:py-8">
        <AdminNav />
        <div className="mb-6">
          <p className="text-sm font-semibold text-teal-800">Search quality</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Search analytics report
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Uses anonymous search and click events only. No IP addresses, emails,
            exact personal locations or browser fingerprints are stored here.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard label="Tracked searches" value={report.totalSearches} icon={Search} />
          <StatsCard label="Searches with clicks" value={report.clickedSearches} icon={MousePointerClick} />
          <StatsCard label="Location available" value={report.locationAvailableSearches} icon={MapPin} />
          <StatsCard
            label="Average latency"
            value={report.averageLatencyMs === null ? "N/A" : `${report.averageLatencyMs} ms`}
            icon={Timer}
          />
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          <AdminTable
            headers={["Zero-result search", "Count", "Results", "Filters"]}
            rows={rowsOrEmpty(
              report.topZeroResultSearches.map((item) => [
                item.query,
                item.count,
                item.resultCount,
                formatFilters(item.filtersUsed),
              ]),
            )}
          />
          <AdminTable
            headers={["No-click search", "Count", "Results", "Filters"]}
            rows={rowsOrEmpty(
              report.topSearchesWithNoClicks.map((item) => [
                item.query,
                item.count,
                item.resultCount,
                formatFilters(item.filtersUsed),
              ]),
            )}
          />
        </section>

        <section className="mt-6">
          <AdminTable
            headers={["Slow search", "Latency", "Results", "Filters"]}
            rows={rowsOrEmpty(
              report.slowestSearches.map((item) => [
                item.query,
                `${item.latencyMs} ms`,
                item.resultCount,
                formatFilters(item.filtersUsed),
              ]),
            )}
          />
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          <AdminTable
            headers={["Possible misspelling", "Suggestion", "Count", "Examples"]}
            rows={rowsOrEmpty(
              report.possibleMisspellings.map((item) => [
                item.term,
                item.suggestion,
                item.count,
                formatExamples(item.examples),
              ]),
            )}
          />
          <AdminTable
            headers={["Repeated term", "Count", "Examples", "Action"]}
            rows={rowsOrEmpty(
              report.repeatedTerms.map((item) => [
                item.term,
                item.count,
                formatExamples(item.examples),
                "Normalize before ranking",
              ]),
            )}
          />
        </section>
      </ResponsiveContainer>
    </main>
  );
}
