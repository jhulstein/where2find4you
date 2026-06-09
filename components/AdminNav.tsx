import Link from "next/link";

const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/places", label: "Places" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/leads", label: "Leads" },
];

export function AdminNav() {
  return (
    <nav className="mb-6 flex gap-2 overflow-x-auto pb-2" aria-label="Admin navigation">
      {adminLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
