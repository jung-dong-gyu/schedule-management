import { createAdminClient } from "@/lib/supabase/admin";
import { listEventsAcrossAccounts, type TaggedEvent } from "@/lib/google/calendar";

const CATEGORIES = ["업무", "개인", "취미", "건강", "재정", "학습", "관계"] as const;

// Single-user app: there is exactly one Supabase Auth user (정동규).
// Cron routes have no session, so we look the user up via the admin client.
export async function getPrimaryUserId() {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers();
  if (error) throw error;
  if (!data.users.length) throw new Error("가입된 사용자가 없음 — 먼저 앱에 로그인/가입 필요");
  return data.users[0].id;
}

type TodoRow = {
  id: string;
  title: string;
  category: string | null;
  priority: string | null;
  due_date: string | null;
  is_completed: boolean;
};

export async function buildBriefing(periodStart: string, periodEnd: string) {
  const admin = createAdminClient();
  const userId = await getPrimaryUserId();

  const [events, todosRes] = await Promise.all([
    listEventsAcrossAccounts(`${periodStart}T00:00:00+09:00`, `${periodEnd}T23:59:59+09:00`),
    admin
      .from("todos")
      .select("id,title,category,priority,due_date,is_completed")
      .eq("user_id", userId)
      .eq("is_completed", false)
      .order("priority", { ascending: true }),
  ]);

  const todos = (todosRes.data ?? []) as TodoRow[];

  const byCategory: Record<
    string,
    { events: TaggedEvent[]; todos: TodoRow[] }
  > = {};

  for (const cat of CATEGORIES) byCategory[cat] = { events: [], todos: [] };
  byCategory["기타"] = { events: [], todos: [] };

  for (const ev of events) {
    const cat = CATEGORIES.includes(ev.accountLabel as (typeof CATEGORIES)[number])
      ? ev.accountLabel
      : "기타";
    (byCategory[cat] ??= { events: [], todos: [] }).events.push(ev);
  }

  for (const todo of todos) {
    const cat = todo.category && CATEGORIES.includes(todo.category as (typeof CATEGORIES)[number])
      ? todo.category
      : "기타";
    const overdue = todo.due_date ? todo.due_date < periodStart : false;
    (byCategory[cat] ??= { events: [], todos: [] }).todos.push({ ...todo, title: overdue ? `[지연] ${todo.title}` : todo.title });
  }

  // Drop empty categories so the UI doesn't render blank sections.
  for (const key of Object.keys(byCategory)) {
    if (!byCategory[key].events.length && !byCategory[key].todos.length) delete byCategory[key];
  }

  return { periodStart, periodEnd, byCategory };
}

export async function saveBriefing(type: "daily" | "weekly", periodStart: string, periodEnd: string) {
  const admin = createAdminClient();
  const userId = await getPrimaryUserId();
  const content = await buildBriefing(periodStart, periodEnd);

  const { error } = await admin.from("briefings").insert({
    user_id: userId,
    type,
    period_start: periodStart,
    period_end: periodEnd,
    content,
  });

  if (error) throw error;
  return content;
}
