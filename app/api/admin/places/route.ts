import { NextResponse } from "next/server";
import { samplePlaces } from "@/lib/data/places";

export async function GET() {
  return NextResponse.json({ places: samplePlaces });
}

export async function POST(request: Request) {
  const body = await request.json();

  // TODO: Insert/update places in Supabase with service-role authorization.
  return NextResponse.json({
    status: "accepted-placeholder",
    place: body,
  });
}
