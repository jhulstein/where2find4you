import type { Metadata } from "next";
import { Activity, Database, Radar } from "lucide-react";
import { AgentRunTable } from "@/components/AgentRunTable";
import { seedAgentRuns } from "@/lib/data/agentRuns";

export const metadata: Metadata = {
  title: "Agent runs | Eiffel Scout",
};

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-teal-800">Admin</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-stone-950 sm:text-4xl">
            Agent runs
          </h1>
        </div>
        <p className="max-w-md text-sm leading-6 text-stone-600">
          Simulated scouting jobs for the MVP. Real workers and scheduled jobs
          can attach to the same shape later.
        </p>
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <Activity aria-hidden="true" size={20} className="text-teal-700" />
          <p className="mt-3 text-sm text-stone-500">Recent runs</p>
          <p className="text-2xl font-semibold text-stone-950">
            {seedAgentRuns.length}
          </p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <Radar aria-hidden="true" size={20} className="text-blue-700" />
          <p className="mt-3 text-sm text-stone-500">Primary city</p>
          <p className="text-2xl font-semibold text-stone-950">Oslo</p>
        </div>
        <div className="rounded-lg border border-stone-200 bg-white p-4">
          <Database aria-hidden="true" size={20} className="text-amber-700" />
          <p className="mt-3 text-sm text-stone-500">Data mode</p>
          <p className="text-2xl font-semibold text-stone-950">Seeded</p>
        </div>
      </div>

      <AgentRunTable initialRuns={seedAgentRuns} />
    </main>
  );
}
