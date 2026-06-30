import Link from "next/link";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <ResponsiveContainer className="py-8">
        <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="font-semibold text-slate-950">where2find4you.com</p>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
              We help people find places — and help places get found.
            </p>
            <p className="mt-3 max-w-xl text-xs leading-5 text-slate-500">
              Privacy notice: anonymous search and click behavior may be used to
              improve recommendations and provide aggregated statistics to listed
              places. Personal identity is not stored unless accounts are added later.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-950">Explore</p>
            <div className="mt-3 grid gap-2 text-sm text-slate-600">
              <Link href="/search">Search places</Link>
              <Link href="/business">For businesses</Link>
              <Link href="/about">About</Link>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    </footer>
  );
}
