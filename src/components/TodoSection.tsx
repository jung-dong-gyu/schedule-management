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

export default function TodoSection() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("개인");
  const [dueDate, setDueDate] = useState("");
  const [filter, setFilter] = useState("전체");
  const [loading, setLoading] = useState(true);

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
            <div
              key={t.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3"
            >
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
              <div className="flex shrink-0 items-center gap-2">
                {t.category && <CategoryBadge label={t.category} />}
                <button onClick={() => remove(t.id)} className="text-xs text-red-500">
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
