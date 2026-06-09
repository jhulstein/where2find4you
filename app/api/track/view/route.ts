import { NextResponse } from "next/server";
import { logView } from "@/lib/tracking";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    placeId: string;
    searchId?: string | null;
    sessionId?: string;
  };

  return NextResponse.json({ record: await logView(body) });
}
