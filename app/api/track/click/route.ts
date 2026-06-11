import { NextResponse } from "next/server";
import { logClick } from "@/lib/tracking";
import type { ClickType } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    placeId: string;
    searchId?: string | null;
    sessionId?: string;
    clickType: ClickType;
    resultPosition?: number;
  };

  return NextResponse.json({ record: await logClick(body) });
}
