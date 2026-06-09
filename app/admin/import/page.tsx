import { AdminNav } from "@/components/AdminNav";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";
import { categoryOptions } from "@/lib/data/places";

export default function AdminImportPage() {
  return (
    <main>
      <ResponsiveContainer className="py-6 sm:py-8">
        <AdminNav />
        <div className="mb-6">
          <p className="text-sm font-semibold text-teal-800">OpenStreetMap import</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Import pilot places
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            MVP import is prepared for Overpass API. It stores source IDs,
            avoids duplicates and creates AI-ready placeholder descriptions.
          </p>
        </div>

        <form className="grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-3">
          <input className="h-11 rounded-lg border border-slate-200 px-3" placeholder="City or area, e.g. Oslo" />
          <input className="h-11 rounded-lg border border-slate-200 px-3" placeholder="Latitude" />
          <input className="h-11 rounded-lg border border-slate-200 px-3" placeholder="Longitude" />
          <input className="h-11 rounded-lg border border-slate-200 px-3" placeholder="Radius in meters" />
          <input className="h-11 rounded-lg border border-slate-200 px-3" placeholder="Maximum places" />
          <select className="h-11 rounded-lg border border-slate-200 px-3">
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>{category.label}</option>
            ))}
          </select>
          <button className="min-h-11 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white md:col-span-2 xl:col-span-3">
            Run OpenStreetMap import placeholder
          </button>
        </form>
      </ResponsiveContainer>
    </main>
  );
}
