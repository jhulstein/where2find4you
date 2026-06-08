import type { AgentRun } from "@/lib/types";

export async function runWorkFriendlyScout(
  city: string,
): Promise<Partial<AgentRun>> {
  // TODO: Add OpenAI scoring over reviews, photos, opening hours, and seating/outlet signals.
  return {
    agentName: "Work Friendly Scout",
    city,
    status: "completed",
    placesFound: city.toLowerCase() === "oslo" ? 7 : 0,
    placesUpdated: city.toLowerCase() === "oslo" ? 6 : 0,
  };
}
