"use client";

import { useEffect, useMemo, useState } from "react";
import CategoryBadge from "@/components/CategoryBadge";

type Todo = {
  id: string;
  title: string;
  category: string | null;
  priority: string | null; // 긴급 / 보통 / 여유
  due_date: string | null;
  due_time: string | null; // "HH:MM:SS" or null (종일)
  is_completed: boolean;
  notes: string | null;
  source: string; // "common" | "routine"
};

const CATEGORIES = ["개인", "업무", "취미", "건강", "재정", "학습", "관계"];
const PRIORITIES = ["긴급", "보통", "여유"];

const PRIORITY_TAG: Record<string, { label: string; className: string }> = {
  긴급: { label: "High", className: "bg-red-100 text-red-700" },
  보통: { label: "Middle", className: "bg-green-100 text-green-700" },
  여유: { label: "Low", className: "bg-blue-100 text-blue-700" },
};

const PRIORITY_RANK: Record<string, number> = { 긴급: 0, 보통: 1, 여유: 2 };

// 1순위 시간대(빠른 시간 먼저, 종일은 최하위) → 2순위 긴급도 → 3순위 제목 가나다순
function compareTodos(a: Todo, b: Todo) {
  const at = a.due_time ?? "24:00:00";
  const bt = b.due_time ?? "24:00:00";
  if (at !== bt) return at < bt ? -1 : 1;

  const ap = PRIORITY_RANK[a.priority ?? "보통"] ?? 1;
  const bp = PRIORITY_RANK[b.priority ?? "보통"] ?? 1;
  if (ap !== bp) return ap - bp;

  return a.title.localeCompare(b.title, "ko");
}

function todayStr() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function timeLabel(t: string | null) {
  if (!t) return "종일";
  return t.slice(0, 5);
}

function SourceTag({ source }: { source: string }) {
  const isRoutine = source === "routine";
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${
        isRoutine ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      {isRoutine ? "Routine" : "Common"}
    </span>
  );
}

function PriorityTag({ priority }: { priority: string | null }) {
  const tag = priority ? PRIORITY_TAG[priority] : undefined;
  if (!tag) return null;
  return <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${tag.className}`}>{tag.label}</span>;
}

export default function TodoSection({
  todayOnly = false,
  fixedDate,
}: {
  todayOnly?: boolean;
  fixedDate?: string;
}) {
  // `lockedDate` set → this section only shows/creates items for exactly that
  // date, and the date field in the add form is hidden (fixed to it) rather
  // than editable. Used for the home "오늘의 할 일" section (todayOnly) and
  // for the '할 일' 탭's per-day view (fixedDate).
  const lockedDate = fixedDate ?? (todayOnly ? todayStr() : undefined);

  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("개인");
  const [priority, setPriority] = useState("보통");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");
  const [notes, setNotes] = useState("");
  const [filter, setFilter] = useState("전체");
  const [loading, setLoading] = useState(true);

  // Inline "이동" / "한 번 더하기" date picker state — only one row can have
  // its picker open at a time.
  const [action, setAction] = useState<{ id: string; mode: "move" | "copy" } | null>(null);
  const [actionDate, setActionDate] = useState("");
  const [actionBusy, setActionBusy] = useState(false);

  // 항목 수정
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    category: "개인",
    priority: "보통",
    due_time: "",
    notes: "",
  });
  const [editBusy, setEditBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/todos");
    const { todos } = await res.json();
    setTodos(todos ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const effectiveDueDate = lockedDate ?? dueDate;
  const canAddTodo = Boolean(title.trim() && category && priority && effectiveDueDate && dueTime);

  async function addTodo(e: React.FormEvent) {
    e.preventDefault();
    if (!canAddTodo) return;
    await fetch("/api/todos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        category,
        priority,
        due_date: effectiveDueDate,
        due_time: dueTime,
        notes: notes || null,
      }),
    });
    setTitle("");
    setDueDate("");
    setDueTime("");
    setPriority("보통");
    setNotes("");
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
            priority: todo.priority,
            due_date: actionDate,
            due_time: todo.due_time,
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

  function openEdit(todo: Todo) {
    setEditingId(todo.id);
    setEditForm({
      title: todo.title,
      category: todo.category ?? "개인",
      priority: todo.priority ?? "보통",
      due_time: todo.due_time ? todo.due_time.slice(0, 5) : "",
      notes: todo.notes ?? "",
    });
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(id: string) {
    setEditBusy(true);
    try {
      await fetch(`/api/todos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          category: editForm.category,
          priority: editForm.priority,
          due_time: editForm.due_time || null,
          notes: editForm.notes || null,
        }),
      });
      setEditingId(null);
      await load();
    } finally {
      setEditBusy(false);
    }
  }

  const scoped = lockedDate ? todos.filter((t) => t.due_date === lockedDate) : todos;

  const labels = useMemo(
    () => ["전체", ...Array.from(new Set(scoped.map((t) => t.category).filter(Boolean) as string[]))],
    [scoped]
  );
  const filtered = filter === "전체" ? scoped : scoped.filter((t) => t.category === filter);
  const visible = lockedDate ? [...filtered].sort(compareTodos) : filtered;

  const heading = todayOnly ? "오늘의 할 일" : lockedDate ? `${lockedDate} 할 일` : "할 일";

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-gray-500">{heading}</h2>

      <form onSubmit={addTodo} className="mb-3 flex flex-col gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="새 할 일"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <div className="flex flex-wrap gap-2">
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
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm sm:flex-none"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          {lockedDate ? (
            <span className="flex items-center rounded-lg bg-gray-100 px-2 py-2 text-sm text-gray-500">
              {lockedDate}
            </span>
          ) : (
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm sm:flex-none"
            />
          )}
          <input
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 px-2 py-2 text-sm sm:flex-none"
          />
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="메모 (선택, 인지해야 할 내용/컨텍스트 등)"
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={!canAddTodo}
          className="self-start rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          추가
        </button>
      </form>

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
                <div className="flex min-w-0 items-center gap-2">
                  <input
                    type="checkbox"
                    checked={t.is_completed}
                    onChange={() => toggle(t)}
                    className="shrink-0"
                  />
                  <SourceTag source={t.source} />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`truncate text-sm ${t.is_completed ? "text-gray-400 line-through" : ""}`}>
                        {t.title}
                      </span>
                      <PriorityTag priority={t.priority} />
                    </div>
                    <div className="text-xs text-gray-400">
                      {timeLabel(t.due_time)}
                      {t.due_date ? ` · 마감 ${t.due_date}` : ""}
                    </div>
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
                  <button onClick={() => openEdit(t)} className="text-xs text-gray-500">
                    수정
                  </button>
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

              {editingId === t.id && (
                <div className="mt-2 space-y-2 border-t border-gray-100 pt-2">
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                  />
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs sm:flex-none"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                      className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs sm:flex-none"
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                    <input
                      type="time"
                      value={editForm.due_time}
                      onChange={(e) => setEditForm({ ...editForm, due_time: e.target.value })}
                      title="시간대 (비우면 종일)"
                      className="flex-1 rounded-lg border border-gray-300 px-2 py-1.5 text-xs sm:flex-none"
                    />
                  </div>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    placeholder="메모 (인지해야 할 내용, 컨텍스트 등)"
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => saveEdit(t.id)}
                      disabled={editBusy}
                      className="rounded-lg bg-gray-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-50"
                    >
                      저장
                    </button>
                    <button onClick={cancelEdit} className="text-xs text-gray-400">
                      취소
                    </button>
                  </div>
                </div>
              )}

              {editingId !== t.id && t.notes && (
                <div className="mt-2 border-t border-gray-100 pt-2 text-xs text-gray-500">{t.notes}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
