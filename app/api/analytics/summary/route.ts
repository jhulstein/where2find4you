import { NextResponse } from "next/server";
import { getAnalyticsSummary } from "@/lib/analytics";

export async function GET() {
  return NextResponse.json(getAnalyticsSummary());
}
