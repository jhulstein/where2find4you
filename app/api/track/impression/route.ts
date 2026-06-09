import { NextResponse } from "next/server";
import { logImpressions } from "@/lib/tracking";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    places: Array<{ id: string; isSponsored: boolean }>;
    searchId?: string | null;
    sessionId?: string;
  };

  return NextResponse.json({
    records: await logImpressions({
      places: body.places,
      searchId: body.searchId ?? null,
      sessionId: body.sessionId,
    }),
  });
}
