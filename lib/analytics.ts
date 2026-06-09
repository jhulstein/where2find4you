import { activePlaces, categoryOptions } from "@/lib/data/places";
import {
  placeClicks,
  placeImpressions,
  placeViews,
  searches,
} from "@/lib/tracking";
import type { Place, PlaceAnalytics } from "@/lib/types";

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((accumulator, item) => {
    const key = getKey(item);
    accumulator[key] = (accumulator[key] ?? 0) + 1;
    return accumulator;
  }, {});
}

export function getPlaceAnalytics(place: Place): PlaceAnalytics {
  const impressions = placeImpressions.filter((item) => item.placeId === place.id);
  const clicks = placeClicks.filter((item) => item.placeId === place.id);
  const views = placeViews.filter((item) => item.placeId === place.id);
  const ctr = impressions.length > 0 ? Math.round((clicks.length / impressions.length) * 1000) / 10 : 0;

  return {
    place,
    impressions: impressions.length,
    clicks: clicks.length,
    views: views.length,
    sponsoredImpressions: impressions.filter((item) => item.isSponsored).length,
    organicImpressions: impressions.filter((item) => !item.isSponsored).length,
    ctr,
    suggestedAction:
      !place.isSponsored && impressions.length > 12
        ? "Contact for paid promotion"
        : place.isSponsored
          ? "Send sponsored performance update"
          : "Keep monitoring",
  };
}

export function getAnalyticsSummary() {
  const placeAnalytics = activePlaces.map(getPlaceAnalytics);
  const topByImpressions = [...placeAnalytics].sort((a, b) => b.impressions - a.impressions).slice(0, 10);
  const topByClicks = [...placeAnalytics].sort((a, b) => b.clicks - a.clicks).slice(0, 10);
  const queryCounts = countBy(searches, (search) => search.query);
  const categoryCounts = countBy(activePlaces, (place) => place.category);
  const sponsored = placeAnalytics.filter(({ place }) => place.isSponsored);
  const organic = placeAnalytics.filter(({ place }) => !place.isSponsored);

  return {
    totalSearches: searches.length,
    totalImpressions: placeImpressions.length,
    totalClicks: placeClicks.length,
    totalViews: placeViews.length,
    topByImpressions,
    topByClicks,
    topSearchQueries: Object.entries(queryCounts)
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    topCategories: categoryOptions
      .map((category) => ({
        category: category.label,
        count: categoryCounts[category.id] ?? 0,
      }))
      .sort((a, b) => b.count - a.count),
    sponsoredSummary: {
      places: sponsored.length,
      impressions: sponsored.reduce((total, item) => total + item.impressions, 0),
      clicks: sponsored.reduce((total, item) => total + item.clicks, 0),
    },
    organicSummary: {
      places: organic.length,
      impressions: organic.reduce((total, item) => total + item.impressions, 0),
      clicks: organic.reduce((total, item) => total + item.clicks, 0),
    },
    leads: placeAnalytics
      .filter((item) => item.suggestedAction === "Contact for paid promotion")
      .sort((a, b) => b.impressions - a.impressions),
  };
}
