import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client. Bypasses RLS entirely — the ONLY place allowed to
// read/write the google_accounts table (OAuth refresh tokens).
// Never import this into client components or expose it to the browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
