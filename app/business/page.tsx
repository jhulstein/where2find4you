import { BarChart3, Eye, LineChart, Megaphone, MousePointerClick, UserRoundCheck } from "lucide-react";
import { BusinessCTA } from "@/components/BusinessCTA";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";

export default function BusinessPage() {
  const sections = [
    {
      icon: Eye,
      title: "Visibility",
      text: "Appear when people search for places, services and experiences like yours.",
    },
    {
      icon: BarChart3,
      title: "Search statistics",
      text: "See aggregated searches, impressions, views and clicks tied to your listing.",
    },
    {
      icon: Megaphone,
      title: "Visibility tools",
      text: "Improve how your place appears in relevant discovery moments without making search feel spammy.",
    },
    {
      icon: UserRoundCheck,
      title: "Enhanced profile",
      text: "Add stronger descriptions, links, tags, contact details and future booking signals.",
    },
    {
      icon: MousePointerClick,
      title: "Lead generation",
      text: "Turn high-intent searches into clicks, calls, website visits and business inquiries.",
    },
    {
      icon: LineChart,
      title: "Why join",
      text: "The platform is built to show where real user interest appears before selling promotion.",
    },
  ];

  return (
    <main>
      <ResponsiveContainer className="py-10 sm:py-14">
        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold text-teal-800">For businesses</p>
            <h1 className="mt-2 max-w-3xl text-4xl font-semibold text-slate-950 sm:text-5xl">
              Get found by people already searching for places like yours.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-700">
              where2find4you.com helps listed places understand demand, improve
              visibility and turn discovery into measurable business opportunities.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-semibold text-slate-950">Contact form placeholder</h2>
            <div className="mt-4 grid gap-3">
              <input className="h-11 rounded-lg border border-slate-200 px-3" placeholder="Business name" />
              <input className="h-11 rounded-lg border border-slate-200 px-3" placeholder="Email" />
              <textarea className="rounded-lg border border-slate-200 px-3 py-2" rows={4} placeholder="Tell us what you want to promote" />
              <button className="min-h-11 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white">
                Request visibility options
              </button>
            </div>
          </div>
        </section>

        <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sections.map((section) => (
            <article key={section.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <section.icon aria-hidden="true" size={23} className="text-teal-700" />
              <h2 className="mt-4 font-semibold text-slate-950">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{section.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-12">
          <BusinessCTA />
        </section>
      </ResponsiveContainer>
    </main>
  );
}
