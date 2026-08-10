import { createBrowserClient } from "@supabase/ssr";

// Browser-side client. Only ever touches tables covered by RLS
// (todos, briefings) — never google_accounts.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
