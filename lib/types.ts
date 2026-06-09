export type PlaceCategory =
  | "restaurants"
  | "cafes"
  | "hotels"
  | "attractions"
  | "activities"
  | "shops"
  | "marinas"
  | "bars"
  | "museums"
  | "parks"
  | "local-services";

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
  name: string;
  slug: string;
  category: PlaceCategory;
  description: string;
  shortDescription: string;
  address: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  websiteUrl: string | null;
  phone: string | null;
  email: string | null;
  imageUrl: string | null;
  source: "seed" | "openstreetmap" | "manual";
  sourceId: string | null;
  tags: string[];
  isSponsored: boolean;
  sponsoredPriority: number;
  isActive: boolean;
  rating: number | null;
  openingHours: string;
  createdAt: string;
  updatedAt: string;
};

export type SearchRecord = {
  id: string;
  query: string;
  detectedCategory: PlaceCategory | null;
  detectedLocation: string | null;
  userCity: string | null;
  userCountry: string | null;
  sessionId: string;
  createdAt: string;
};

export type PlaceImpression = {
  id: string;
  placeId: string;
  searchId: string | null;
  sessionId: string;
  resultPosition: number;
  isSponsored: boolean;
  createdAt: string;
};

export type ClickType =
  | "profile"
  | "website"
  | "map"
  | "phone"
  | "booking"
  | "claim"
  | "promote";

export type PlaceClick = {
  id: string;
  placeId: string;
  searchId: string | null;
  sessionId: string;
  clickType: ClickType;
  createdAt: string;
};

export type PlaceView = {
  id: string;
  placeId: string;
  searchId: string | null;
  sessionId: string;
  createdAt: string;
};

export type ImportBatch = {
  id: string;
  source: "openstreetmap";
  areaName: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  categories: PlaceCategory[];
  requestedLimit: number;
  importedCount: number;
  skippedDuplicates: number;
  createdAt: string;
};

export type BusinessLead = {
  id: string;
  placeId: string;
  leadStatus: "new" | "contacted" | "qualified" | "won" | "lost";
  notes: string;
  lastContactedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PlaceAnalytics = {
  place: Place;
  impressions: number;
  clicks: number;
  views: number;
  sponsoredImpressions: number;
  organicImpressions: number;
  ctr: number;
  suggestedAction: string;
};

export type CategoryOption = {
  id: PlaceCategory;
  label: string;
  description: string;
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
