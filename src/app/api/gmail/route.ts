import { NextRequest, NextResponse } from "next/server";
import { listRecentEmailsAcrossAccounts } from "@/lib/google/gmail";

// GET /api/gmail?account=업무 (optional filter)
export async function GET(request: NextRequest) {
  const account = request.nextUrl.searchParams.get("account");
  let emails = await listRecentEmailsAcrossAccounts();
  if (account) emails = emails.filter((e) => e.accountLabel === account);
  return NextResponse.json({ emails });
}
