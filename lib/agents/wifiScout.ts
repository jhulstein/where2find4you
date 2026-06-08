import type { AgentRun } from "@/lib/types";

export async function runWifiScout(city: string): Promise<Partial<AgentRun>> {
  // TODO: Connect Google Places, OpenStreetMap tags, and venue websites for real WiFi evidence.
  return {
    agentName: "WiFi Scout",
    city,
    status: "completed",
    placesFound: city.toLowerCase() === "oslo" ? 10 : 0,
    placesUpdated: city.toLowerCase() === "oslo" ? 8 : 0,
  };
}
