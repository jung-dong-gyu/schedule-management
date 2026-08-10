import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Server-side client bound to the signed-in user's session (RLS applies).
// Use inside Route Handlers / Server Components.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component with no write access — safe to ignore,
            // middleware refreshes the session cookie instead.
          }
        },
      },
    }
  );
}
