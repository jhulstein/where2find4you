import { AdminNav } from "@/components/AdminNav";
import { AdminTable } from "@/components/AdminTable";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { getAnalyticsSummary } from "@/lib/analytics";

export default function AdminLeadsPage() {
  const summary = getAnalyticsSummary();

  return (
    <main>
      <ResponsiveContainer className="py-6 sm:py-8">
        <AdminNav />
        <div className="mb-6">
          <p className="text-sm font-semibold text-teal-800">Business opportunities</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950 sm:text-4xl">
            High-interest places to contact
          </h1>
        </div>

        <AdminTable
          headers={["Place", "Category", "Impressions", "Clicks", "CTR", "Sponsored", "Suggested action"]}
          rows={summary.leads.map((lead) => [
            lead.place.name,
            lead.place.category.replace("-", " "),
            lead.impressions,
            lead.clicks,
            `${lead.ctr}%`,
            lead.place.isSponsored ? "Yes" : "No",
            "Contact for paid promotion",
          ])}
        />
      </ResponsiveContainer>
    </main>
  );
}
