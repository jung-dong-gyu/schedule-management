import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateRoutineRows, todayStr } from "@/lib/routines";

// PATCH { title, category?, priority?, dueTime?, days: string[], startDate, endDate }
// Updates the routine template, wipes its future/未완료 instances, and
// regenerates them from max(today, startDate) to endDate on the new schedule.
// Past and already-completed instances are left untouched as history.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json();
  const { title, category, priority, dueTime, days, startDate, endDate } = body as {
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

  const { data: routine, error: updateError } = await supabase
    .from("routines")
    .update({
      title,
      category: category ?? null,
      priority: priority ?? "보통",
      due_time: dueTime || null,
      days,
      start_date: startDate,
      end_date: endDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError || !routine) {
    return NextResponse.json({ error: updateError?.message ?? "루틴을 찾을 수 없어요" }, { status: 404 });
  }

  // Wipe this routine's future, not-yet-done instances before regenerating.
  const { error: deleteError } = await supabase
    .from("todos")
    .delete()
    .eq("routine_id", id)
    .eq("is_completed", false)
    .gte("due_date", today);

  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 });

  const fromDate = startDate > today ? startDate : today;
  const rows = generateRoutineRows(routine, fromDate);

  let inserted: unknown[] = [];
  if (rows.length > 0) {
    const { data, error: insertError } = await supabase.from("todos").insert(rows).select();
    if (insertError) return NextResponse.json({ error: insertError.message }, { status: 500 });
    inserted = data ?? [];
  }

  return NextResponse.json({ routine, count: inserted.length });
}

// DELETE — removes the routine template and its future/미완료 instances.
// Past and completed instances stay as history (routine_id just becomes null
// via the FK's ON DELETE SET NULL).
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const today = todayStr();

  const { error: deleteFutureError } = await supabase
    .from("todos")
    .delete()
    .eq("routine_id", id)
    .eq("is_completed", false)
    .gte("due_date", today);

  if (deleteFutureError) return NextResponse.json({ error: deleteFutureError.message }, { status: 500 });

  const { error } = await supabase.from("routines").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
