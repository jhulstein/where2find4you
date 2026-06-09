import Link from "next/link";
import { ArrowRight, BarChart3 } from "lucide-react";

export function BusinessCTA() {
  return (
    <section className="rounded-2xl bg-slate-950 p-6 text-white shadow-sm sm:p-8 lg:p-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/20 text-teal-200">
            <BarChart3 aria-hidden="true" size={22} />
          </div>
          <h2 className="text-2xl font-semibold sm:text-3xl">
            Want your place to be found?
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-300">
            Get visibility when people are already searching for restaurants,
            services, activities, hotels and local experiences like yours.
          </p>
        </div>
        <Link
          href="/business"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
        >
          Explore business tools
          <ArrowRight aria-hidden="true" size={17} />
        </Link>
      </div>
    </section>
  );
}
