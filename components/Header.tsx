import Link from "next/link";
import { Map, Radar } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-950 text-white">
            <Radar aria-hidden="true" size={19} />
          </span>
          <span>
            <span className="block text-sm font-semibold leading-4 text-stone-950">
              Eiffel Scout
            </span>
            <span className="block text-xs text-stone-500">City discovery</span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="flex items-center gap-2">
          <Link
            href="/city/oslo"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 hover:text-stone-950"
          >
            <Map aria-hidden="true" size={16} />
            Oslo
          </Link>
          <Link
            href="/admin"
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm font-medium text-stone-700 transition hover:border-stone-300 hover:bg-stone-100 hover:text-stone-950"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
