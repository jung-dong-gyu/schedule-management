import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRoutineRows, todayStr } from "@/lib/routines";

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

  const rows = generateRoutineRows(routine, startDate);
  if (rows.length === 0) {
    return NextResponse.json({ error: "생성될 날짜가 없어요" }, { status: 400 });
  }

  const { data, error } = await supabase.from("todos").insert(rows).select();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ routine, todos: data, count: data?.length ?? 0 });
}
