import { createClient } from "@/lib/supabase/server";
import NavBar from "@/components/NavBar";
import CategoryBadge from "@/components/CategoryBadge";

type BriefingContent = {
  periodStart: string;
  periodEnd: string;
  byCategory: Record<
    string,
    {
      events: { id: string; title: string; start?: string | null; accountLabel: string }[];
      todos: { id: string; title: string; due_date: string | null; priority: string | null }[];
    }
  >;
};

export default async function BriefingPage() {
  const supabase = await createClient();

  const [{ data: daily }, { data: weekly }] = await Promise.all([
    supabase.from("briefings").select("*").eq("type", "daily").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("briefings").select("*").eq("type", "weekly").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return (
    <div>
      <NavBar />
      <main className="mx-auto max-w-2xl px-3 py-6 sm:px-4 sm:py-8">
        <h1 className="mb-6 text-lg font-semibold">브리핑</h1>

        <BriefingSection title="오늘의 브리핑" briefing={daily?.content as BriefingContent | undefined} />
        <div className="h-8" />
        <BriefingSection title="이번 주 브리핑" briefing={weekly?.content as BriefingContent | undefined} />
      </main>
    </div>
  );
}

function BriefingSection({ title, briefing }: { title: string; briefing?: BriefingContent }) {
  if (!briefing) {
    return (
      <section>
        <h2 className="mb-2 text-sm font-medium text-gray-500">{title}</h2>
        <p className="text-sm text-gray-400">
          아직 생성된 브리핑이 없어요. 크론이 처음 돌거나, /api/cron/daily · /api/cron/weekly를 수동 호출하면 생겨요.
        </p>
      </section>
    );
  }

  const categories = Object.entries(briefing.byCategory ?? {});

  return (
    <section>
      <h2 className="mb-1 text-sm font-medium text-gray-500">{title}</h2>
      <p className="mb-3 text-xs text-gray-400">
        {briefing.periodStart} ~ {briefing.periodEnd}
      </p>
      {categories.length === 0 && <p className="text-sm text-gray-400">이 기간엔 일정도 할 일도 없어요.</p>}
      <div className="space-y-4">
        {categories.map(([category, group]) => (
          <div key={category} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="mb-2">
              <CategoryBadge label={category} />
            </div>
            {group.events.map((ev) => (
              <div key={ev.id} className="py-1 text-sm">
                📅 {ev.start ? new Date(ev.start).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""} — {ev.title}
              </div>
            ))}
            {group.todos.map((t) => (
              <div key={t.id} className="py-1 text-sm">
                ✅ {t.title} {t.due_date ? `(마감 ${t.due_date})` : ""} {t.priority === "긴급" ? "🔴" : ""}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
