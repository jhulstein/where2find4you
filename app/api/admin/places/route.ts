import { NextResponse } from "next/server";
import { samplePlaces } from "@/lib/data/places";
import { syncTypesensePlace } from "@/lib/search/typesenseSync";
import type { Place } from "@/lib/types";

export async function GET() {
  return NextResponse.json({ places: samplePlaces });
}

function isSyncablePlace(value: unknown): value is Place {
  if (!value || typeof value !== "object") {
    return false;
  }

  const place = value as Partial<Place>;

  return Boolean(
    place.id &&
      place.name &&
      place.category &&
      Array.isArray(place.tags) &&
      typeof place.isActive === "boolean",
  );
}

export async function POST(request: Request) {
  const body: unknown = await request.json();

  // TODO: Insert/update places in Supabase with service-role authorization.
  if (isSyncablePlace(body)) {
    await syncTypesensePlace(body);
  }

  return NextResponse.json({
    status: "accepted-placeholder",
    place: body,
  });
}
