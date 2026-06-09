import { categoryOptions } from "@/lib/data/places";
import type { Place } from "@/lib/types";

type PlaceFormProps = {
  place?: Place;
};

export function PlaceForm({ place }: PlaceFormProps) {
  return (
    <form className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="place-name">
          Name
        </label>
        <input
          id="place-name"
          defaultValue={place?.name}
          className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          placeholder="Place name"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="place-category">
          Category
        </label>
        <select
          id="place-category"
          defaultValue={place?.category}
          className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
        >
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="place-city">
          City
        </label>
        <input
          id="place-city"
          defaultValue={place?.city}
          className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          placeholder="Oslo"
        />
      </div>
      <div className="md:col-span-2">
        <label className="text-sm font-medium text-slate-700" htmlFor="place-description">
          Description
        </label>
        <textarea
          id="place-description"
          defaultValue={place?.description}
          rows={4}
          className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          placeholder="Short AI-ready profile description"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="place-website">
          Website
        </label>
        <input
          id="place-website"
          defaultValue={place?.websiteUrl ?? ""}
          className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          placeholder="https://"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-700" htmlFor="place-phone">
          Phone
        </label>
        <input
          id="place-phone"
          defaultValue={place?.phone ?? ""}
          className="mt-1 h-11 w-full rounded-lg border border-slate-200 px-3 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-100"
          placeholder="+47"
        />
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" defaultChecked={place?.isSponsored} />
        Mark as sponsored
      </label>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" defaultChecked={place?.isActive ?? true} />
        Active listing
      </label>
      <div className="md:col-span-2">
        <button
          type="button"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white transition hover:bg-teal-800"
        >
          Save placeholder
        </button>
      </div>
    </form>
  );
}
