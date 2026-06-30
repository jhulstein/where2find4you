import Link from "next/link";
import { Compass } from "lucide-react";
import { InstallAppButton } from "@/components/InstallAppButton";
import { MobileMenu } from "@/components/MobileMenu";

const links = [
  { href: "/search", label: "Search" },
  { href: "/business", label: "For businesses" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-screen-2xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
            <Compass aria-hidden="true" size={20} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold leading-4 text-slate-950 sm:text-base">
              where2find4you.com
            </span>
            <span className="block truncate text-xs text-slate-500">
              Places found. Places discovered.
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <InstallAppButton />
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
