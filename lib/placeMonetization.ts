import type { Place } from "@/lib/types";

type SponsorablePlace = Pick<Place, "isSponsored" | "sponsored">;

export function isSponsoredPlace(place: SponsorablePlace) {
  if (typeof place.sponsored === "boolean") {
    return place.sponsored === true;
  }

  return place.isSponsored === true;
}
