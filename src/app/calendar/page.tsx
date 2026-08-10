"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
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

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<string>("전체");
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(14);

  useEffect(() => {
    const from = new Date().toISOString();
    const to = new Date(Date.now() + rangeDays * 86400000).toISOString();
    setLoading(true);
    fetch(`/api/calendar?from=${from}&to=${to}`)
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .finally(() => setLoading(false));
  }, [rangeDays]);

  const labels = useMemo(() => ["전체", ...Array.from(new Set(events.map((e) => e.accountLabel)))], [events]);
  const visible = filter === "전체" ? events : events.filter((e) => e.accountLabel === filter);

  return (
    <div>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">일정</h1>
          <select
            value={rangeDays}
            onChange={(e) => setRangeDays(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
          >
            <option value={7}>앞으로 7일</option>
            <option value={14}>앞으로 14일</option>
            <option value={30}>앞으로 30일</option>
          </select>
        </div>

        <div className="mb-4 flex gap-2">
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

        {loading ? (
          <p className="text-sm text-gray-400">불러오는 중...</p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-gray-400">이 기간엔 일정이 없어요.</p>
        ) : (
          <div className="space-y-2">
            {visible.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div>
                  <div className="text-sm">{ev.title}</div>
                  <div className="text-xs text-gray-400">
                    {ev.start ? new Date(ev.start).toLocaleString("ko-KR") : ""}
                  </div>
                </div>
                <CategoryBadge label={ev.accountLabel} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
