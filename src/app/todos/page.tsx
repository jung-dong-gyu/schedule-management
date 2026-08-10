"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
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

const CATEGORIES = ["업무", "개인", "취미", "건강", "재정", "학습", "관계"];

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("업무");
  const [dueDate, setDueDate] = useState("");
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

  return (
    <div>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-4 text-lg font-semibold">할 일</h1>

        <form onSubmit={addTodo} className="mb-6 flex flex-wrap gap-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="새 할 일"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
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
            className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white">
            추가
          </button>
        </form>

        {loading ? (
          <p className="text-sm text-gray-400">불러오는 중...</p>
        ) : todos.length === 0 ? (
          <p className="text-sm text-gray-400">할 일이 없어요.</p>
        ) : (
          <div className="space-y-2">
            {todos.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={t.is_completed} onChange={() => toggle(t)} />
                  <div>
                    <div className={`text-sm ${t.is_completed ? "text-gray-400 line-through" : ""}`}>
                      {t.title}
                    </div>
                    {t.due_date && <div className="text-xs text-gray-400">마감 {t.due_date}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {t.category && <CategoryBadge label={t.category} />}
                  <button onClick={() => remove(t.id)} className="text-xs text-red-500">
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
