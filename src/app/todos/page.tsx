"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import TodoSection from "@/components/TodoSection";

const WEEKDAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];

function todayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function TodosCalendarPage() {
  const today = todayStr();
  const [year, setYear] = useState(() => Number(today.slice(0, 4)));
  const [month, setMonth] = useState(() => Number(today.slice(5, 7)) - 1); // 0-indexed
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState(today);

  useEffect(() => {
    fetch("/api/todos")
      .then((r) => r.json())
      .then((d) => {
        const dates = (d.todos ?? [])
          .map((t: { due_date: string | null }) => t.due_date)
          .filter((v: string | null): v is string => Boolean(v));
        setMarkedDates(new Set(dates));
      });
  }, [selectedDate]); // re-check marks whenever the selected day's list may have changed

  const cells = useMemo(() => {
    const firstOfMonth = new Date(year, month, 1);
    const startWeekday = firstOfMonth.getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const list: { date: string | null; day: number | null }[] = [];
    for (let i = 0; i < startWeekday; i++) list.push({ date: null, day: null });
    for (let d = 1; d <= daysInMonth; d++) {
      list.push({ date: `${year}-${pad(month + 1)}-${pad(d)}`, day: d });
    }
    return list;
  }, [year, month]);

  function prevMonth() {
    if (month === 0) {
      setYear((y) => y - 1);
      setMonth(11);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setYear((y) => y + 1);
      setMonth(0);
    } else {
      setMonth((m) => m + 1);
    }
  }

  return (
    <div>
      <NavBar />
      <main className="mx-auto max-w-2xl px-3 py-6 sm:px-4 sm:py-8">
        <h1 className="mb-4 text-lg font-semibold">할 일</h1>

        <div className="mb-4 rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <button onClick={prevMonth} className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100">
              ‹
            </button>
            <span className="text-sm font-medium">
              {year}년 {month + 1}월
            </span>
            <button onClick={nextMonth} className="rounded-lg px-2 py-1 text-sm text-gray-500 hover:bg-gray-100">
              ›
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
            {WEEKDAY_HEADERS.map((w) => (
              <div key={w} className="py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((c, i) =>
              c.date === null ? (
                <div key={i} />
              ) : (
                <button
                  key={c.date}
                  onClick={() => setSelectedDate(c.date!)}
                  className={`flex flex-col items-center rounded-lg py-1.5 text-sm ${
                    selectedDate === c.date
                      ? "bg-gray-900 text-white"
                      : c.date === today
                      ? "bg-gray-100 font-semibold text-gray-900"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span>{c.day}</span>
                  <span
                    className={`mt-0.5 h-1 w-1 rounded-full ${
                      markedDates.has(c.date) ? (selectedDate === c.date ? "bg-white" : "bg-gray-900") : ""
                    }`}
                  />
                </button>
              )
            )}
          </div>
        </div>

        <TodoSection key={selectedDate} fixedDate={selectedDate} />
      </main>
    </div>
  );
}
