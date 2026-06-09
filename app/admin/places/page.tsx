import Link from "next/link";
import { AdminNav } from "@/components/AdminNav";
import { AdminTable } from "@/components/AdminTable";
import { PlaceForm } from "@/components/PlaceForm";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { samplePlaces } from "@/lib/data/places";

export default function AdminPlacesPage() {
  return (
    <main>
      <ResponsiveContainer className="py-6 sm:py-8">
        <AdminNav />
        <div className="mb-6">
          <p className="text-sm font-semibold text-teal-800">Places management</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Manage listed places
          </h1>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
          <AdminTable
            headers={["Place", "Category", "City", "Sponsored", "Priority", "Active", "Analytics"]}
            rows={samplePlaces.map((place) => [
              <span key={place.id} className="font-medium text-slate-950">{place.name}</span>,
              place.category.replace("-", " "),
              place.city,
              place.isSponsored ? "Yes" : "No",
              place.sponsoredPriority,
              place.isActive ? "Active" : "Inactive",
              <Link key={`${place.id}-analytics`} href={`/admin/analytics/${place.slug}`} className="font-semibold text-teal-800">
                View
              </Link>,
            ])}
          />
          <div>
            <h2 className="mb-3 font-semibold text-slate-950">Add or edit place</h2>
            <PlaceForm />
          </div>
        </section>
      </ResponsiveContainer>
    </main>
  );
}
