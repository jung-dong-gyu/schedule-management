import { NextRequest, NextResponse } from "next/server";
import { saveBriefing } from "@/lib/briefing";
import { todayKST } from "@/lib/date";

// Vercel Cron calls this with `Authorization: Bearer $CRON_SECRET`.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const today = todayKST();
  const content = await saveBriefing("daily", today, today);
  return NextResponse.json({ ok: true, content });
}
