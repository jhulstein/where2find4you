import type { AgentRun } from "@/lib/types";

export const seedAgentRuns: AgentRun[] = [
  {
    id: "run-oslo-wifi-001",
    agentName: "WiFi Scout",
    city: "Oslo",
    status: "completed",
    placesFound: 10,
    placesUpdated: 8,
    errorMessage: null,
    startedAt: "2026-06-08T08:15:00.000Z",
    completedAt: "2026-06-08T08:17:00.000Z",
  },
  {
    id: "run-oslo-work-001",
    agentName: "Work Friendly Scout",
    city: "Oslo",
    status: "completed",
    placesFound: 7,
    placesUpdated: 6,
    errorMessage: null,
    startedAt: "2026-06-08T08:20:00.000Z",
    completedAt: "2026-06-08T08:24:00.000Z",
  },
  {
    id: "run-oslo-rooftop-001",
    agentName: "Rooftop Scout",
    city: "Oslo",
    status: "queued",
    placesFound: 0,
    placesUpdated: 0,
    errorMessage: null,
    startedAt: "2026-06-08T09:00:00.000Z",
    completedAt: null,
  },
];
