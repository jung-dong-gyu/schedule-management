import { NextRequest, NextResponse } from "next/server";
import { listEventsAcrossAccounts, createEventOnAccount } from "@/lib/google/calendar";

// GET /api/calendar?from=ISO&to=ISO&account=업무  (account filter optional)
export async function GET(request: NextRequest) {
  const from = request.nextUrl.searchParams.get("from");
  const to = request.nextUrl.searchParams.get("to");
  const account = request.nextUrl.searchParams.get("account");

  if (!from || !to) {
    return NextResponse.json({ error: "from, to 쿼리 파라미터 필요" }, { status: 400 });
  }

  let events = await listEventsAcrossAccounts(from, to);
  if (account) events = events.filter((e) => e.accountLabel === account);

  return NextResponse.json({ events });
}

// POST { email, summary, description?, start, end, allDay? }
export async function POST(request: NextRequest) {
  const body = await request.json();
  const event = await createEventOnAccount(body.email, body);
  return NextResponse.json({ event });
}
