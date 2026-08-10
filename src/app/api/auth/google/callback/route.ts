import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getOAuthClient } from "@/lib/google/oauth";
import { createAdminClient } from "@/lib/supabase/admin";
import { google } from "googleapis";

// Google redirects here after consent. We exchange the code for tokens,
// look up which email just authorized us, and upsert it into google_accounts.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const label = request.nextUrl.searchParams.get("state") ?? "기타";

  if (!code) {
    return NextResponse.redirect(new URL("/settings?error=missing_code", request.url));
  }

  const tokens = await exchangeCodeForTokens(code);

  if (!tokens.refresh_token) {
    // Google only returns a refresh_token on first consent (or when prompt=consent,
    // which we always pass) — if it's still missing, something's off.
    return NextResponse.redirect(new URL("/settings?error=no_refresh_token", request.url));
  }

  const client = getOAuthClient();
  client.setCredentials(tokens);
  const oauth2 = google.oauth2({ version: "v2", auth: client });
  const { data: profile } = await oauth2.userinfo.get();

  if (!profile.email) {
    return NextResponse.redirect(new URL("/settings?error=no_email", request.url));
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("google_accounts")
    .upsert(
      {
        email: profile.email,
        label,
        refresh_token: tokens.refresh_token,
        scopes: (tokens.scope ?? "").split(" ").filter(Boolean),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

  if (error) {
    return NextResponse.redirect(
      new URL(`/settings?error=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  return NextResponse.redirect(new URL("/settings?connected=" + profile.email, request.url));
}
