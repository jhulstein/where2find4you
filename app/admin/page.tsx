import { BarChart3, Eye, MousePointerClick, Search } from "lucide-react";
import { AdminNav } from "@/components/AdminNav";
import { AdminTable } from "@/components/AdminTable";
import { DashboardChart } from "@/components/DashboardChart";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { StatsCard } from "@/components/StatsCard";
import { getAnalyticsSummary } from "@/lib/analytics";

export default function AdminOverviewPage() {
  const summary = getAnalyticsSummary();

  return (
    <main>
      <ResponsiveContainer className="py-6 sm:py-8">
        <AdminNav />
        <div className="mb-6">
          <p className="text-sm font-semibold text-teal-800">Admin dashboard</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Discovery analytics overview
          </h1>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard label="Total searches" value={summary.totalSearches} icon={Search} />
          <StatsCard label="Place impressions" value={summary.totalImpressions} icon={Eye} />
          <StatsCard label="Place clicks" value={summary.totalClicks} icon={MousePointerClick} />
          <StatsCard label="Place views" value={summary.totalViews} icon={BarChart3} />
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          <DashboardChart
            title="Top search queries"
            data={summary.topSearchQueries.map((item) => ({ label: item.query, value: item.count }))}
          />
          <DashboardChart
            title="Top categories"
            data={summary.topCategories.map((item) => ({ label: item.category, value: item.count }))}
          />
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          <AdminTable
            headers={["Top by impressions", "Category", "Impressions", "Clicks", "CTR"]}
            rows={summary.topByImpressions.map((item) => [
              item.place.name,
              item.place.category.replace("-", " "),
              item.impressions,
              item.clicks,
              `${item.ctr}%`,
            ])}
          />
          <AdminTable
            headers={["Top by clicks", "Sponsored", "Impressions", "Clicks", "Action"]}
            rows={summary.topByClicks.map((item) => [
              item.place.name,
              item.place.isSponsored ? "Yes" : "No",
              item.impressions,
              item.clicks,
              item.suggestedAction,
            ])}
          />
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Sponsored performance summary</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <StatsCard label="Sponsored places" value={summary.sponsoredSummary.places} icon={BarChart3} />
            <StatsCard label="Sponsored impressions" value={summary.sponsoredSummary.impressions} icon={Eye} />
            <StatsCard label="Sponsored clicks" value={summary.sponsoredSummary.clicks} icon={MousePointerClick} />
          </div>
        </section>
      </ResponsiveContainer>
    </main>
  );
}
