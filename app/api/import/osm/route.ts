import { NextResponse } from "next/server";
import { importFromOverpass } from "@/lib/import/overpass";
import type { PlaceCategory } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    areaName: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
    categories: PlaceCategory[];
    limit: number;
  };

  const result = await importFromOverpass(body);
  return NextResponse.json(result);
}
