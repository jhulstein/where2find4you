"use client";

import type { ClickType } from "@/lib/types";

const SESSION_STORAGE_KEY = "where2find4you_session_id";

function makeSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getAnonymousSessionId() {
  if (typeof window === "undefined") {
    return "anonymous-session";
  }

  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (existing) {
    return existing;
  }

  const sessionId = makeSessionId();
  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

export function sendTrackingEvent(path: string, payload: Record<string, unknown>) {
  if (typeof navigator === "undefined") {
    return;
  }

  const body = JSON.stringify({
    sessionId: getAnonymousSessionId(),
    ...payload,
  });

  if ("sendBeacon" in navigator) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(path, blob);
    return;
  }

  void fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function trackPlaceClick(input: {
  placeId: string;
  clickType: ClickType;
  searchId?: string | null;
}) {
  sendTrackingEvent("/api/track/click", input);
}
