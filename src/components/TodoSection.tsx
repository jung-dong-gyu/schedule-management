"use client";

import { useEffect, useMemo, useState } from "react";
import CategoryBadge from "@/components/CategoryBadge";

type Todo = {
  id: string;
  title: string;
  category: string | null;
  priority: string | null;
  due_date: string | null;
  is_completed: boolean;
  notes: string | null;
};

const CATEGORIES = ["개인", "업무", "취미", "건강", "재정", "학습", "관계"];
const WEEKDAYS = ["월", "화", "수", "목", "금", "토", "일"];

function todayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function TodoSection() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("개인");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState("전체");
  const [loading, setLoading] = useState(true);

  // Inline "이동" / "한 번 더하기" date picker state — only one row can have
  // its picker open at a time.
  const [action, setAction] = useState<{ id: string; mode: "move" | "copy" } | null>(null);
  const [actionDate, setActionDate] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  // 루틴(반복) 일괄 생성 폼
  const [showRoutine, setShowRoutine] = useState(false);
  const [routineTitle, setRoutineTitle] = useState("");
  const [routineCategory, setRoutineCategory] = useState("개인");
  const [routineDays, setRoutineDays] = useState<string[]>([]);
  const [routineStart, setRoutineStart] = useState(todayStr());
  const [routineEnd, setRoutineEnd] = useState("");
  const [routineNotes, setRoutineNotes] = useState("");
  const [routineBusy, setRoutineBusy] = useState(false);
  const [routineMessage, setRoutineMessage] = useState("");

  async function load() {
    const res = await fetch("/api/todos");
    const { todos } = await res.json();
    setTodos(todos ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, category, due_date: dueDate || null }),
    });
    setTitle("");
    setDueDate("");
    load();
  }

  async function toggle(todo: Todo) {
    await fetch(`/api/todos/${todo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_completed: !todo.is_completed }),
    });
    load();
  }

  async function remove(id: string) {
    await fetch(`/api/todos/${id}`, { method: "DELETE" });
    load();
  }

  function openMove(todo: Todo) {
    setAction({ id: todo.id, mode: "move" });
    setActionDate(todo.due_date ?? todayStr());
  }

  function openCopy(todo: Todo) {
    setAction({ id: todo.id, mode: "copy" });
    setActionDate(todayStr());
  }

  function cancelAction() {
    setAction(null);
    setActionDate("");
  }

  async function confirmAction(todo: Todo) {
    if (!action || !actionDate) return;
    setActionBusy(true);
    try {
      if (action.mode === "move") {
        await fetch(`/api/todos/${todo.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ due_date: actionDate }),
        });
      } else {
        // "한 번 더하기" — leaves the original (completed) row untouched and
        // creates a fresh, unchecked copy on the chosen date.
        await fetch("/api/todos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: todo.title,
            category: todo.category,
            due_date: actionDate,
            notes: todo.notes,
          }),
        });
      }
      cancelAction();
      await load();
    } finally {
      setActionBusy(false);
    }
  }

  function toggleRoutineDay(day: string) {
    setRoutineDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  }

  async function submitRoutine(e: React.FormEvent) {
    e.preventDefault();
    if (!routineTitle.trim() || routineDays.length === 0 || !routineStart || !routineEnd) return;

    setRoutineBusy(true);
    setRoutineMessage("");
    try {
      const res = await fetch("/api/todos/routine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: routineTitle,
          category: routineCategory,
          notes: routineNotes || null,
          days: routineDays,
          startDate: routineStart,
          endDate: routineEnd,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRoutineMessage(data.error ?? "생성에 실패했어요");
        return;
      }
      setRoutineMessage(`${data.count}개의 할 일이 생성됐어요`);
      setRoutineTitle("");
      setRoutineDays([]);
      setRoutineNotes("");
      await load();
    } finally {
      setRoutineBusy(false);
    }
  }

  const labels = useMemo(
    () => ["전체", ...Array.from(new Set(todos.map((t) => t.category).filter(Boolean) as string[]))],
    [todos]
  );
  const visible = filter === "전체" ? todos : todos.filter((t) => t.category === filter);

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-gray-500">할 일</h2>

      <form onSubmit={addTodo} className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="새 할 일"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm sm:flex-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm sm:flex-none"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
          >
            추가
          </button>
        </div>
      </form>

      <div className="mb-4">
        <button
          onClick={() => setShowRoutine((v) => !v)}
          className="text-xs text-gray-500 underline underline-offset-2"
        >
          {showRoutine ? "루틴 접기" : "+ 루틴으로 일괄 추가"}
        </button>

        {showRoutine && (
          <form
            onSubmit={submitRoutine}
            className="mt-2 space-y-3 rounded-xl border border-gray-200 bg-white p-4"
          >
            <input
              value={routineTitle}
              onChange={(e) => setRoutineTitle(e.target.value)}
              placeholder="반복할 할 일 제목"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            />

            <select
              value={routineCategory}
              onChange={(e) => setRoutineCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm sm:w-auto"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleRoutineDay(day)}
                  className={`h-8 w-8 rounded-full text-xs ${
                    routineDays.includes(day) ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600"
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
                  value={routineStart}
                  onChange={(e) => setRoutineStart(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm"
                  required
                />
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-500">
                종료일
                <input
                  type="date"
                  value={routineEnd}
                  onChange={(e) => setRoutineEnd(e.target.value)}
                  className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm"
                  required
                />
              </label>
            </div>

            <textarea
              value={routineNotes}
              onChange={(e) => setRoutineNotes(e.target.value)}
              placeholder="메모 (선택, 생성되는 모든 항목에 동일하게 적용)"
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={routineBusy}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {routineBusy ? "생성 중..." : "일괄 생성"}
              </button>
              {routineMessage && <span className="text-xs text-gray-500">{routineMessage}</span>}
            </div>
          </form>
        )}
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
        <p className="text-sm text-gray-400">할 일이 없어요.</p>
      ) : (
        <div className="space-y-2">
          {visible.map((t) => (
            <div key={t.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <input
                    type="checkbox"
                    checked={t.is_completed}
                    onChange={() => toggle(t)}
                    className="shrink-0"
                  />
                  <div className="min-w-0">
                    <div className={`truncate text-sm ${t.is_completed ? "text-gray-400 line-through" : ""}`}>
                      {t.title}
                    </div>
                    {t.due_date && <div className="text-xs text-gray-400">마감 {t.due_date}</div>}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  {t.category && <CategoryBadge label={t.category} />}
                  {!t.is_completed && (
                    <button onClick={() => openMove(t)} className="text-xs text-gray-500">
                      이동
                    </button>
                  )}
                  {t.is_completed && (
                    <button onClick={() => openCopy(t)} className="text-xs text-gray-500">
                      한 번 더하기
                    </button>
                  )}
                  <button onClick={() => remove(t.id)} className="text-xs text-red-500">
                    삭제
                  </button>
                </div>
              </div>

              {action?.id === t.id && (
                <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2">
                  <span className="text-xs text-gray-400">
                    {action.mode === "move" ? "이동할 날짜" : "다시 할 날짜"}
                  </span>
                  <input
                    type="date"
                    value={actionDate}
                    onChange={(e) => setActionDate(e.target.value)}
                    className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
                  />
                  <button
                    onClick={() => confirmAction(t)}
                    disabled={actionBusy}
                    className="rounded-lg bg-gray-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                  >
                    확인
                  </button>
                  <button onClick={cancelAction} className="text-xs text-gray-400">
                    취소
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
