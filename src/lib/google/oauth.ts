import { google } from "googleapis";
import { createAdminClient } from "@/lib/supabase/admin";

// Scopes: full calendar CRUD, gmail read-only (per the spec — no send/compose).
export const GOOGLE_SCOPES = [
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
];

export function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// `label` (통합/업무/개인/취미/기타) is round-tripped through the OAuth `state`
// param so the callback knows how to tag the account being connected.
export function getGoogleAuthUrl(label: string) {
  const client = getOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // forces a refresh_token every time, even on reconnect
    scope: GOOGLE_SCOPES,
    state: label,
  });
}

export async function exchangeCodeForTokens(code: string) {
  const client = getOAuthClient();
  const { tokens } = await client.getToken(code);
  return tokens;
}

// Returns an OAuth2 client pre-loaded with a stored account's refresh token.
// googleapis auto-refreshes the access token on demand.
export async function getAuthorizedClientForAccount(email: string) {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("google_accounts")
    .select("refresh_token")
    .eq("email", email)
    .single();

  if (error || !data) {
    throw new Error(`연결된 구글 계정을 찾을 수 없음: ${email}`);
  }

  const client = getOAuthClient();
  client.setCredentials({ refresh_token: data.refresh_token });
  return client;
}

export async function listConnectedAccounts() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("google_accounts")
    .select("email, label, created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}
