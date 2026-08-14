// Shared helpers for generating/regenerating the concrete `todos` rows that
// back a `routines` template. Used by both the routine-create route and the
// routine-edit (bulk regenerate) route.

export const DAY_INDEX: Record<string, number> = {
  일: 0,
  월: 1,
  화: 2,
  수: 3,
  목: 4,
  금: 5,
  토: 6,
};

export function todayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export type RoutineLike = {
  id: string;
  user_id: string;
  title: string;
  category: string | null;
  priority: string;
  due_time: string | null;
  days: string[];
  end_date: string;
};

// Generates the concrete `todos` rows for a routine, for the date range
// [fromDate, routine.end_date] (inclusive), on the routine's selected weekdays.
export function generateRoutineRows(routine: RoutineLike, fromDate: string) {
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
