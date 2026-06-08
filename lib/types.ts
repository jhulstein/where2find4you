export type City = {
  id: string;
  name: string;
  slug: string;
  country: string;
  latitude: number;
  longitude: number;
};

export type Place = {
  id: string;
  cityId: string;
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  website: string | null;
  rating: number | null;
  priceLevel: number | null;
  openingHours: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type PlaceScore = {
  id: string;
  placeId: string;
  wifiScore: number;
  workScore: number;
  quietScore: number;
  rooftopScore: number | null;
  viewScore: number | null;
  confidenceScore: number;
  totalScore: number;
  summary: string;
  pros: string[];
  cons: string[];
  sourceNotes: string[];
  checkedAt: string;
};

export type AgentRunStatus = "queued" | "running" | "completed" | "failed";

export type AgentRun = {
  id: string;
  agentName: string;
  city: string;
  status: AgentRunStatus;
  placesFound: number;
  placesUpdated: number;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
};
