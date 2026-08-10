import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl } from "@/lib/google/oauth";

// GET /api/auth/google/connect?label=업무  -> redirects into Google's consent screen
export async function GET(request: NextRequest) {
  const label = request.nextUrl.searchParams.get("label") ?? "기타";
  const url = getGoogleAuthUrl(label);
  return NextResponse.redirect(url);
}
