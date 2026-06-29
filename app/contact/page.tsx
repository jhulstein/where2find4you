import { Mail, MapPin } from "lucide-react";
import { ResponsiveContainer } from "@/components/ResponsiveContainer";

export default function ContactPage() {
  return (
    <main>
      <ResponsiveContainer className="py-10 sm:py-14">
        <section className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold text-teal-800">Contact</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-950 sm:text-5xl">
              Talk to where2find4you.
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-700">
              Use this placeholder form for pilot destinations, business
              inquiries, listing improvements and partnership ideas.
            </p>
            <div className="mt-6 space-y-3 text-sm text-slate-600">
              <p className="flex items-center gap-2">
                <Mail aria-hidden="true" size={17} className="text-teal-700" />
                hello@where2find4you.com
              </p>
              <p className="flex items-center gap-2">
                <MapPin aria-hidden="true" size={17} className="text-teal-700" />
                Pilot-ready for Oslo, Bergen, Copenhagen, Barcelona and cruise ports
              </p>
            </div>
          </div>
          <form className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="grid gap-4 sm:grid-cols-2">
              <input className="h-11 rounded-lg border border-slate-200 px-3" placeholder="Name" />
              <input className="h-11 rounded-lg border border-slate-200 px-3" placeholder="Email" />
              <input className="h-11 rounded-lg border border-slate-200 px-3 sm:col-span-2" placeholder="Subject" />
              <textarea className="rounded-lg border border-slate-200 px-3 py-2 sm:col-span-2" rows={6} placeholder="Message" />
              <button className="min-h-11 rounded-lg bg-teal-700 px-4 text-sm font-semibold text-white sm:col-span-2">
                Send placeholder message
              </button>
            </div>
          </form>
        </section>
      </ResponsiveContainer>
    </main>
  );
}
