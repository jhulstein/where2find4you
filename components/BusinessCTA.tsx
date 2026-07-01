import Link from "next/link";
import { ArrowRight, BarChart3, ExternalLink } from "lucide-react";

export function BusinessCTA() {
  const paymentLink = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK?.trim();

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
        <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
          {paymentLink ? (
            <a
              href={paymentLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
            >
              Upgrade listing
              <ExternalLink aria-hidden="true" size={17} />
            </a>
          ) : null}
          <Link
            href="/business"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-white/20 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Explore business tools
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
}
