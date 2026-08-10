import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// POST { email } -> removes a connected Google account (calendar-share style
// "add/remove" ergonomics, per the original requirement).
export async function POST(request: NextRequest) {
  const { email } = await request.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("google_accounts").delete().eq("email", email);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
