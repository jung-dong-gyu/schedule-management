import { NextRequest, NextResponse } from "next/server";
import { saveBriefing } from "@/lib/briefing";
import { nextWeekRangeKST } from "@/lib/date";

// Runs Sundays (see vercel.json). Summarizes the upcoming Mon–Sun.
export async function GET(request: NextRequest) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const [start, end] = nextWeekRangeKST();
  const content = await saveBriefing("weekly", start, end);
  return NextResponse.json({ ok: true, content });
}
