"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const links = [
  { href: "/search", label: "Search" },
  { href: "/business", label: "For businesses" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700"
        aria-label="Toggle navigation"
      >
        {isOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
      </button>
      {isOpen ? (
        <div className="absolute left-4 right-4 top-16 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <nav className="grid gap-1" aria-label="Mobile navigation">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
