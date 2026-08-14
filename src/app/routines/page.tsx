"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import CategoryBadge from "@/components/CategoryBadge";

type Routine = {
  id: string;
  title: string;
  category: string | null;
  priority: string;
  due_time: string | null;
  days: string[];
  start_date: string;
  end_date: string;
};

const CATEGORIES = ["개인", "업무", "취미", "건강", "재정", "학습", "관계"];
const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];
const PRIORITIES = ["긴급", "보통", "여유"];

function todayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function addMonths(dateStr: string, months: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1 + months, d);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

type EditForm = {
  title: string;
  category: string;
  priority: string;
  dueTime: string;
  days: string[];
  startDate: string;
  endDate: string;
};

function toEditForm(r: Routine): EditForm {
  const today = todayStr();
  return {
    title: r.title,
    category: r.category ?? "개인",
    priority: r.priority,
    dueTime: r.due_time ? r.due_time.slice(0, 5) : "",
    days: r.days,
    startDate: r.start_date > today ? r.start_date : today,
    endDate: r.end_date,
  };
}

export default function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/routines");
    const d = await res.json();
    setRoutines(d.routines ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function openEdit(r: Routine) {
    setEditingId(r.id);
    setForm(toEditForm(r));
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(null);
  }

  function toggleDay(day: string) {
    if (!form) return;
    setForm({
      ...form,
      days: form.days.includes(day) ? form.days.filter((d) => d !== day) : [...form.days, day],
    });
  }

  async function saveEdit(id: string) {
    if (!form || !form.title.trim() || form.days.length === 0 || !form.startDate || !form.endDate) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/routines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          priority: form.priority,
          dueTime: form.dueTime || null,
          days: form.days,
          startDate: form.startDate,
          endDate: form.endDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error ?? "수정에 실패했어요");
        return;
      }
      cancelEdit();
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("이 루틴을 삭제할까요? 아직 완료하지 않은 앞으로의 할 일들도 함께 삭제돼요.")) return;
    await fetch(`/api/routines/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <NavBar />
      <main className="mx-auto max-w-2xl px-3 py-6 sm:px-4 sm:py-8">
        <h1 className="mb-6 text-lg font-semibold">루틴</h1>

        {loading ? (
          <p className="text-sm text-gray-400">불러오는 중...</p>
        ) : routines.length === 0 ? (
          <p className="text-sm text-gray-400">
            아직 만든 루틴이 없어요. 홈 화면의 &quot;+ 루틴으로 일괄 추가&quot;에서 만들 수 있어요.
          </p>
        ) : (
          <div className="space-y-3">
            {routines.map((r) => (
              <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4">
                {editingId === r.id && form ? (
                  <div className="space-y-3">
                    <input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />

                    <div className="flex flex-wrap gap-2">
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm sm:flex-none"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm sm:flex-none"
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={form.dueTime}
                        onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
                        title="시간대 (비우면 종일)"
                        className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm sm:flex-none"
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {WEEKDAYS.map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={`h-8 w-8 rounded-full text-xs ${
                            form.days.includes(day) ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <label className="flex items-center gap-2 text-xs text-gray-500">
                        시작일
                        <input
                          type="date"
                          value={form.startDate}
                          min={todayStr()}
                          onChange={(e) => {
                            const v = e.target.value;
                            setForm({ ...form, startDate: v, endDate: form.endDate && form.endDate < v ? v : form.endDate });
                          }}
                          className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm"
                        />
                      </label>
                      <label className="flex items-center gap-2 text-xs text-gray-500">
                        종료일
                        <input
                          type="date"
                          value={form.endDate}
                          min={form.startDate || todayStr()}
                          onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                          className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm"
                        />
                      </label>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: "1개월", months: 1 },
                        { label: "3개월", months: 3 },
                        { label: "12개월", months: 12 },
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() =>
                            setForm({ ...form, endDate: addMonths(form.startDate || todayStr(), opt.months) })
                          }
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <p className="text-xs text-gray-400">
                      저장하면 아직 완료하지 않은 앞으로의 할 일들이 새 설정으로 다시 생성돼요. 지난 기록과 완료된
                      항목은 그대로 남아요.
                    </p>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => saveEdit(r.id)}
                        disabled={busy}
                        className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                      >
                        {busy ? "저장 중..." : "저장"}
                      </button>
                      <button onClick={cancelEdit} className="text-xs text-gray-400">
                        취소
                      </button>
                      {message && <span className="text-xs text-red-500">{message}</span>}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-medium">{r.title}</span>
                        {r.category && <CategoryBadge label={r.category} />}
                      </div>
                      <div className="mt-1 text-xs text-gray-400">
                        {r.days.join(" · ")} · {r.due_time ? r.due_time.slice(0, 5) : "종일"} · {r.priority}
                      </div>
                      <div className="text-xs text-gray-400">
                        {r.start_date} ~ {r.end_date}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <button onClick={() => openEdit(r)} className="text-xs text-gray-500">
                        수정
                      </button>
                      <button onClick={() => remove(r.id)} className="text-xs text-red-500">
                        삭제
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
