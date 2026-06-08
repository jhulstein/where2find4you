"use client";

import { useState } from "react";
import { Play, RefreshCw } from "lucide-react";
import type { AgentRun } from "@/lib/types";

type AgentRunTableProps = {
  initialRuns: AgentRun[];
};

function formatTime(value: string | null) {
  if (!value) {
    return "Pending";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusClass(status: AgentRun["status"]) {
  if (status === "completed") {
    return "bg-teal-50 text-teal-800";
  }

  if (status === "running") {
    return "bg-blue-50 text-blue-800";
  }

  if (status === "failed") {
    return "bg-rose-50 text-rose-800";
  }

  return "bg-stone-100 text-stone-700";
}

export function AgentRunTable({ initialRuns }: AgentRunTableProps) {
  const [runs, setRuns] = useState(initialRuns);
  const [isRunning, setIsRunning] = useState(false);

  function runMockOsloScan() {
    const startedAt = new Date();
    const runId = `run-${startedAt.getTime()}`;
    const nextRun: AgentRun = {
      id: runId,
      agentName: "Mock Oslo Scan",
      city: "Oslo",
      status: "running",
      placesFound: 0,
      placesUpdated: 0,
      errorMessage: null,
      startedAt: startedAt.toISOString(),
      completedAt: null,
    };

    setIsRunning(true);
    setRuns((current) => [nextRun, ...current]);

    window.setTimeout(() => {
      setRuns((current) =>
        current.map((run) =>
          run.id === runId
            ? {
                ...run,
                status: "completed",
                placesFound: 10,
                placesUpdated: 7,
                completedAt: new Date().toISOString(),
              }
            : run,
        ),
      );
      setIsRunning(false);
    }, 1200);
  }

  return (
    <section className="rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold text-stone-950">Simulated agent runs</h2>
          <p className="mt-1 text-sm text-stone-600">
            Local-only state for the first MVP.
          </p>
        </div>
        <button
          type="button"
          onClick={runMockOsloScan}
          disabled={isRunning}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-stone-300"
        >
          {isRunning ? (
            <RefreshCw aria-hidden="true" size={16} className="animate-spin" />
          ) : (
            <Play aria-hidden="true" size={16} />
          )}
          Run mock Oslo scan
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-normal text-stone-500">
            <tr>
              <th className="px-4 py-3 font-semibold">Agent</th>
              <th className="px-4 py-3 font-semibold">City</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Found</th>
              <th className="px-4 py-3 font-semibold">Updated</th>
              <th className="px-4 py-3 font-semibold">Started</th>
              <th className="px-4 py-3 font-semibold">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {runs.map((run) => (
              <tr key={run.id} className="align-top">
                <td className="px-4 py-4 font-medium text-stone-950">
                  {run.agentName}
                  {run.errorMessage ? (
                    <p className="mt-1 text-xs text-rose-700">
                      {run.errorMessage}
                    </p>
                  ) : null}
                </td>
                <td className="px-4 py-4 text-stone-700">{run.city}</td>
                <td className="px-4 py-4">
                  <span
                    className={`rounded-lg px-2 py-1 text-xs font-semibold ${statusClass(
                      run.status,
                    )}`}
                  >
                    {run.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-stone-700">{run.placesFound}</td>
                <td className="px-4 py-4 text-stone-700">
                  {run.placesUpdated}
                </td>
                <td className="px-4 py-4 text-stone-700">
                  {formatTime(run.startedAt)}
                </td>
                <td className="px-4 py-4 text-stone-700">
                  {formatTime(run.completedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
