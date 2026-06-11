import { NextResponse } from "next/server";
import { getSearchAnalyticsReport } from "@/lib/searchAnalytics";

export function GET() {
  return NextResponse.json(getSearchAnalyticsReport());
}
