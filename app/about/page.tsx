import { Database, Search, Sparkles } from "lucide-react";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";

export default function AboutPage() {
  return (
    <main>
      <ResponsiveContainer className="py-10 sm:py-14">
        <section className="max-w-4xl">
          <p className="text-sm font-semibold text-teal-800">About</p>
          <h1 className="mt-2 text-4xl font-semibold text-slate-950 sm:text-5xl">
            A discovery platform for people and places.
          </h1>
          <p className="mt-5 text-lg leading-8 text-slate-700">
            where2find4you.com is an AI-powered discovery platform that helps
            people find relevant places faster, while giving businesses insight
            into how often they are discovered, viewed and clicked.
          </p>
        </section>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            {
              icon: Search,
              title: "People search in natural language",
              text: "The MVP supports practical searches for places, services, restaurants, activities, hotels, marinas and experiences.",
            },
            {
              icon: Sparkles,
              title: "AI-ready recommendation layer",
              text: "The current ranking is deterministic and structured so OpenAI interpretation can be added later.",
            },
            {
              icon: Database,
              title: "Aggregated business insight",
              text: "Anonymous searches, impressions and clicks can identify where commercial interest is strongest.",
            },
          ].map((item) => (
            <article key={item.title} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <item.icon aria-hidden="true" size={23} className="text-teal-700" />
              <h2 className="mt-4 font-semibold text-slate-950">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-950">Privacy-first MVP</h2>
          <p className="mt-3 max-w-4xl leading-7 text-slate-700">
            The platform is designed to use anonymous session IDs for tracking.
            It should not store unnecessary personal data. Aggregated behavior
            may be used to improve recommendations and provide statistics to
            listed places.
          </p>
        </section>
      </ResponsiveContainer>
    </main>
  );
}
