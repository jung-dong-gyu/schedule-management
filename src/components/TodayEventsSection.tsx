"use client";

import { useEffect, useMemo, useState } from "react";
import CategoryBadge from "@/components/CategoryBadge";

type Event = {
  id: string;
  accountEmail: string;
  accountLabel: string;
  title: string;
  start?: string | null;
  end?: string | null;
  allDay: boolean;
};

function todayRangeKST() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return {
    from: `${y}-${m}-${d}T00:00:00+09:00`,
    to: `${y}-${m}-${d}T23:59:59+09:00`,
  };
}

export default function TodayEventsSection() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState("전체");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { from, to } = todayRangeKST();
    fetch(`/api/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .finally(() => setLoading(false));
  }, []);

  const labels = useMemo(() => ["전체", ...Array.from(new Set(events.map((e) => e.accountLabel)))], [events]);
  const visible = filter === "전체" ? events : events.filter((e) => e.accountLabel === filter);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-500">오늘의 일정</h2>
        <a href="/calendar" className="text-xs text-gray-400">
          전체 일정 보기 →
        </a>
      </div>

      {labels.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {labels.map((l) => (
            <button
              key={l}
              onClick={() => setFilter(l)}
              className={`rounded-full px-3 py-1 text-xs ${
                filter === l ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">불러오는 중...</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-gray-400">오늘은 일정이 없어요.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((ev) => (
            <div
              key={`${ev.accountEmail}-${ev.id}`}
              className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm">{ev.title}</div>
                <div className="text-xs text-gray-400">
                  {ev.allDay
                    ? "종일"
                    : ev.start
                    ? new Date(ev.start).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
                    : ""}
                </div>
              </div>
              <CategoryBadge label={ev.accountLabel} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
