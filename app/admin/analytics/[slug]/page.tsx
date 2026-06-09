import { notFound } from "next/navigation";
import { AdminNav } from "@/components/AdminNav";
import { DashboardChart } from "@/components/DashboardChart";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { StatsCard } from "@/components/StatsCard";
import { getPlaceAnalytics } from "@/lib/analytics";
import { getPlaceBySlug, samplePlaces } from "@/lib/data/places";
import { BarChart3, Eye, MousePointerClick } from "lucide-react";

type AdminAnalyticsPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return samplePlaces.map((place) => ({ slug: place.slug }));
}

export default async function AdminAnalyticsPage({ params }: AdminAnalyticsPageProps) {
  const { slug } = await params;
  const place = getPlaceBySlug(slug);

  if (!place) {
    notFound();
  }

  const analytics = getPlaceAnalytics(place);

  return (
    <main>
      <ResponsiveContainer className="py-6 sm:py-8">
        <AdminNav />
        <div className="mb-6">
          <p className="text-sm font-semibold text-teal-800">Place analytics</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950 sm:text-4xl">
            {place.name}
          </h1>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard label="Impressions" value={analytics.impressions} icon={Eye} />
          <StatsCard label="Clicks" value={analytics.clicks} icon={MousePointerClick} />
          <StatsCard label="Views" value={analytics.views} icon={BarChart3} />
          <StatsCard label="CTR" value={`${analytics.ctr}%`} icon={MousePointerClick} />
        </section>

        <section className="mt-6 grid gap-4 xl:grid-cols-2">
          <DashboardChart
            title="Sponsored vs organic"
            data={[
              { label: "Sponsored impressions", value: analytics.sponsoredImpressions },
              { label: "Organic impressions", value: analytics.organicImpressions },
            ]}
          />
          <DashboardChart
            title="Timeline placeholder"
            data={[
              { label: "Week 1", value: Math.max(1, Math.round(analytics.impressions * 0.2)) },
              { label: "Week 2", value: Math.max(1, Math.round(analytics.impressions * 0.35)) },
              { label: "Week 3", value: Math.max(1, Math.round(analytics.impressions * 0.45)) },
            ]}
          />
        </section>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-slate-950">Searches and categories that led here</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This placeholder is ready to join searches, impressions and clicks
            in Supabase once persistent event tables are connected.
          </p>
        </section>
      </ResponsiveContainer>
    </main>
  );
}
