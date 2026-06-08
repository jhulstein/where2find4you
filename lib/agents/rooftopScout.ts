import type { AgentRun } from "@/lib/types";

export async function runRooftopScout(city: string): Promise<Partial<AgentRun>> {
  // TODO: Add rooftop terrace discovery using map data, venue categories, and view-specific scoring.
  return {
    agentName: "Rooftop Scout",
    city,
    status: "queued",
    placesFound: 0,
    placesUpdated: 0,
  };
}
