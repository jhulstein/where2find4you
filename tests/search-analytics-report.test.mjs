import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const reportSource = await readFile(new URL("../lib/searchAnalytics.ts", import.meta.url), "utf8");
const pageSource = await readFile(new URL("../app/admin/search-analytics/page.tsx", import.meta.url), "utf8");
const apiSource = await readFile(new URL("../app/api/analytics/search/route.ts", import.meta.url), "utf8");

test("search analytics report includes the requested quality views", () => {
  assert.match(reportSource, /topZeroResultSearches/);
  assert.match(reportSource, /topSearchesWithNoClicks/);
  assert.match(reportSource, /slowestSearches/);
  assert.match(reportSource, /possibleMisspellings/);
  assert.match(reportSource, /repeatedTerms/);
});

test("search analytics stays lightweight and avoids personal data fields", () => {
  assert.doesNotMatch(reportSource, /\bip(Address)?\b/i);
  assert.doesNotMatch(reportSource, /\bemail\b/i);
  assert.doesNotMatch(reportSource, /\buserAgent\b/i);
  assert.doesNotMatch(reportSource, /\bfingerprint\b/i);
  assert.match(reportSource, /userLocationAvailable/);
});

test("admin and dev surfaces expose the same search report", () => {
  assert.match(pageSource, /getSearchAnalyticsReport/);
  assert.match(pageSource, /Zero-result search/);
  assert.match(pageSource, /No-click search/);
  assert.match(pageSource, /Slow search/);
  assert.match(apiSource, /NextResponse\.json\(getSearchAnalyticsReport\(\)\)/);
});
