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

function todayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Generates the concrete `todos` rows for a routine, for the date range
// [fromDate, routine.end_date] (inclusive), on the routine's selected weekdays.
function generateRows(
  routine: {
    id: string;
    user_id: string;
    title: string;
    category: string | null;
    priority: string;
    due_time: string | null;
    days: string[];
    end_date: string;
  },
  fromDate: string
) {
  const dayIndices = new Set(routine.days.map((d) => DAY_INDEX[d]).filter((i) => i !== undefined));
  const [fy, fm, fd] = fromDate.split("-").map(Number);
  const [ey, em, ed] = routine.end_date.split("-").map(Number);
  const cursor = new Date(fy, fm - 1, fd);
  const end = new Date(ey, em - 1, ed);

  const rows: {
    user_id: string;
    title: string;
    category: string | null;
    priority: string;
    due_time: string | null;
    due_date: string;
    routine_id: string;
    source: "routine";
  }[] = [];

  const MAX_DAYS = 366;
  let guard = 0;

  while (cursor <= end && guard < MAX_DAYS) {
    if (dayIndices.has(cursor.getDay())) {
      const y = cursor.getFullYear();
      const m = String(cursor.getMonth() + 1).padStart(2, "0");
      const d = String(cursor.getDate()).padStart(2, "0");
      rows.push({
        user_id: routine.user_id,
        title: routine.title,
        category: routine.category,
        priority: routine.priority,
        due_time: routine.due_time,
        due_date: `${y}-${m}-${d}`,
        routine_id: routine.id,
        source: "routine",
      });
    }
    cursor.setDate(cursor.getDate() + 1);
    guard++;
  }

  return rows;
}

// POST { title, category?, priority?, dueTime?, days: string[], startDate, endDate }
// Creates a persistent `routines` row, then bulk-generates matching `todos`.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    title,
    category,
    priority,
    dueTime,
    days,
    startDate,
    endDate,
  } = body as {
    title?: string;
    category?: string | null;
    priority?: string;
    dueTime?: string | null;
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

  const today = todayStr();
  if (startDate < today) {
    return NextResponse.json({ error: "시작일은 오늘보다 과거일 수 없어요" }, { status: 400 });
  }
  if (endDate < startDate) {
    return NextResponse.json({ error: "종료일이 시작일보다 빨라요" }, { status: 400 });
  }

  const { data: routine, error: routineError } = await supabase
    .from("routines")
    .insert({
      user_id: user.id,
      title,
      category: category ?? null,
      priority: priority ?? "보통",
      due_time: dueTime || null,
      days,
      start_date: startDate,
      end_date: endDate,
    })
    .select()
    .single();

  if (routineError || !routine) {
    return NextResponse.json({ error: routineError?.message ?? "루틴 생성 실패" }, { status: 500 });
  }

  const rows = generateRows(routine, startDate);
  if (rows.length === 0) {
    return NextResponse.json({ error: "생성될 날짜가 없어요" }, { status: 400 });
  }

  const { data, error } = await supabase.from("todos").insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ routine, todos: data, count: data?.length ?? 0 });
}
