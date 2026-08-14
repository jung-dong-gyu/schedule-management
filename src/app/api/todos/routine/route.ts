import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Korean weekday label -> JS Date.getDay() index (0 = Sun ... 6 = Sat)
const DAY_INDEX: Record<string, number> = {
  일: 0,
  월: 1,
  화: 2,
  수: 3,
  목: 4,
  금: 5,
  토: 6,
};

// POST { title, category?, notes?, days: string[] (한글 요일, 예: ["월","수","금"]), startDate, endDate }
// 시작일~종료일 사이에서 선택한 요일에 해당하는 날짜마다 ToDo를 하나씩 일괄 생성.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, category, notes, days, startDate, endDate } = body as {
    title?: string;
    category?: string | null;
    notes?: string | null;
    days?: string[];
    startDate?: string;
    endDate?: string;
  };

  if (!title?.trim() || !days?.length || !startDate || !endDate) {
    return NextResponse.json(
      { error: "title, days, startDate, endDate는 필수예요" },
      { status: 400 }
    );
  }

  const dayIndices = new Set(days.map((d) => DAY_INDEX[d]).filter((i) => i !== undefined));
  if (dayIndices.size === 0) {
    return NextResponse.json({ error: "유효한 요일이 없어요" }, { status: 400 });
  }

  const [sy, sm, sd] = startDate.split("-").map(Number);
  const [ey, em, ed] = endDate.split("-").map(Number);
  const cursor = new Date(sy, sm - 1, sd);
  const end = new Date(ey, em - 1, ed);

  if (cursor > end) {
    return NextResponse.json({ error: "종료일이 시작일보다 빨라요" }, { status: 400 });
  }

  const rows: {
    user_id: string;
    title: string;
    category: string | null;
    notes: string | null;
    due_date: string;
  }[] = [];

  // Cap the range to avoid runaway inserts from a fat-fingered date range.
  const MAX_DAYS = 366;
  let guard = 0;

  while (cursor <= end && guard < MAX_DAYS) {
    if (dayIndices.has(cursor.getDay())) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, "0");
      const d = String(cursor.getDate()).padStart(2, "0");
      rows.push({
        user_id: user.id,
        title,
        category: category ?? null,
        notes: notes ?? null,
        due_date: `${y}-${m}-${d}`,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "생성될 날짜가 없어요" }, { status: 400 });
  }

  const { data, error } = await supabase.from("todos").insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ todos: data, count: data?.length ?? 0 });
}
