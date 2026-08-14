"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import CategoryBadge from "@/components/CategoryBadge";

type Event = {
  id: string;
  accountEmail: string;
  accountLabel: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start?: string | null;
  end?: string | null;
  allDay: boolean;
};

type Account = { email: string; label: string; created_at: string };

type FormState = {
  email: string;
  summary: string;
  description: string;
  location: string;
  allDay: boolean;
  startDate: string; // date input (all-day)
  startDateTime: string; // datetime-local input
  endDateTime: string;
};

const emptyForm: FormState = {
  email: "",
  summary: "",
  description: "",
  location: "",
  allDay: false,
  startDate: "",
  startDateTime: "",
  endDateTime: "",
};

function toDateTimeLocal(iso?: string | null) {
  if (!iso) return "";
  return iso.slice(0, 16);
}

// Given a "YYYY-MM-DDTHH:mm" datetime-local value, returns the same format
// one hour later (rolls over day/month/year correctly). Used so picking a
// start time auto-fills a sensible default end time.
function addHour(dateTimeLocal: string) {
  if (!dateTimeLocal) return dateTimeLocal;
  const [datePart, timePart] = dateTimeLocal.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  const dt = new Date(y, m - 1, d, hh, mm);
  dt.setHours(dt.getHours() + 1);
  const yy = dt.getFullYear();
  const mo = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const HH = String(dt.getHours()).padStart(2, "0");
  const MI = String(dt.getMinutes()).padStart(2, "0");
  return `${yy}-${mo}-${dd}T${HH}:${MI}`;
}

function nextDay(dateStr: string) {
  // Manually add a day to the "YYYY-MM-DD" string without going through
  // toISOString (which converts to UTC and would shift the date near
  // midnight KST) — Google's all-day `end.date` is exclusive, so this needs
  // to stay exactly one calendar day ahead in local (KST) terms.
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d + 1);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [filter, setFilter] = useState<string>("전체");
  const [loading, setLoading] = useState(true);
  const [rangeDays, setRangeDays] = useState(14);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadEvents() {
    const from = new Date().toISOString();
    const to = new Date(Date.now() + rangeDays * 86400000).toISOString();
    setLoading(true);
    const res = await fetch(`/api/calendar?from=${from}&to=${to}`);
    const d = await res.json();
    setEvents(d.events ?? []);
    setLoading(false);
  }

  async function loadAccounts() {
    const res = await fetch("/api/accounts");
    const d = await res.json();
    setAccounts(d.accounts ?? []);
  }

  useEffect(() => {
    loadEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeDays]);

  useEffect(() => {
    loadAccounts();
  }, []);

  const labels = useMemo(() => ["전체", ...Array.from(new Set(events.map((e) => e.accountLabel)))], [events]);
  const visible = filter === "전체" ? events : events.filter((e) => e.accountLabel === filter);

  function openAddForm() {
    setEditing(null);
    setForm({ ...emptyForm, email: accounts[0]?.email ?? "" });
    setShowForm(true);
  }

  function openEditForm(ev: Event) {
    setEditing(ev);
    setForm({
      email: ev.accountEmail,
      summary: ev.title,
      description: ev.description ?? "",
      location: ev.location ?? "",
      allDay: ev.allDay,
      startDate: ev.allDay ? (ev.start ?? "") : "",
      startDateTime: !ev.allDay ? toDateTimeLocal(ev.start) : "",
      endDateTime: !ev.allDay ? toDateTimeLocal(ev.end) : "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email || !form.summary.trim()) return;

    // Send description/location as plain strings (even "") rather than
    // `undefined` — undefined keys get dropped by JSON.stringify, which
    // would make it impossible to clear a previously-set memo/location
    // while editing.
    const payload = form.allDay
      ? {
          email: form.email,
          summary: form.summary,
          description: form.description,
          location: form.location,
          allDay: true,
          start: form.startDate,
          end: nextDay(form.startDate),
        }
      : {
          email: form.email,
          summary: form.summary,
          description: form.description,
          location: form.location,
          allDay: false,
          start: `${form.startDateTime}:00+09:00`,
          end: `${form.endDateTime}:00+09:00`,
        };

    setSaving(true);
    try {
      if (editing) {
        await fetch(`/api/calendar/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/calendar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      closeForm();
      await loadEvents();
    } finally {
      setSaving(false);
    }
  }

  async function remove(ev: Event) {
    if (!confirm(`"${ev.title}" 일정을 삭제할까요?`)) return;
    await fetch(`/api/calendar/${ev.id}?email=${encodeURIComponent(ev.accountEmail)}`, {
      method: "DELETE",
    });
    loadEvents();
  }

  return (
    <div>
      <NavBar />
      <main className="mx-auto max-w-2xl px-3 py-6 sm:px-4 sm:py-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-semibold">일정</h1>
          <div className="flex items-center gap-2">
            <select
              value={rangeDays}
              onChange={(e) => setRangeDays(Number(e.target.value))}
              className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
            >
              <option value={7}>앞으로 7일</option>
              <option value={14}>앞으로 14일</option>
              <option value={30}>앞으로 30일</option>
            </select>
            <button
              onClick={openAddForm}
              disabled={accounts.length === 0}
              className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40"
            >
              + 일정 추가
            </button>
          </div>
        </div>

        {accounts.length === 0 && (
          <p className="mb-4 text-xs text-gray-400">
            연결된 구글 계정이 없어서 일정을 추가할 수 없어요. 설정 페이지에서 먼저 계정을 연결해주세요.
          </p>
        )}

        {showForm && (
          <form
            onSubmit={submitForm}
            className="mb-4 space-y-3 rounded-xl border border-gray-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{editing ? "일정 수정" : "새 일정"}</h2>
              <button type="button" onClick={closeForm} className="text-xs text-gray-400">
                닫기
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <select
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="rounded-lg border border-gray-300 px-2 py-2 text-sm"
                required
              >
                <option value="" disabled>
                  계정 선택
                </option>
                {accounts.map((a) => (
                  <option key={a.email} value={a.email}>
                    {a.label} — {a.email}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 px-1 text-sm">
                <input
                  type="checkbox"
                  checked={form.allDay}
                  onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
                />
                종일 일정
              </label>
            </div>

            <input
              value={form.summary}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              placeholder="제목"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            />

            {form.allDay ? (
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                required
              />
            ) : (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  type="datetime-local"
                  value={form.startDateTime}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm({ ...form, startDateTime: v, endDateTime: addHour(v) });
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  required
                />
                <input
                  type="datetime-local"
                  value={form.endDateTime}
                  onChange={(e) => setForm({ ...form, endDateTime: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            )}

            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="위치 (선택)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />

            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="메모 (선택)"
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />

            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 sm:w-auto"
            >
              {saving ? "저장 중..." : editing ? "수정 저장" : "일정 추가"}
            </button>
          </form>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
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
              <div
                key={`${ev.accountEmail}-${ev.id}`}
                className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="text-sm">{ev.title}</div>
                  <div className="text-xs text-gray-400">
                    {ev.start ? new Date(ev.start).toLocaleString("ko-KR") : ""}
                  </div>
                  {ev.location && <div className="text-xs text-gray-400">📍 {ev.location}</div>}
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <CategoryBadge label={ev.accountLabel} />
                  <button onClick={() => openEditForm(ev)} className="text-xs text-gray-500">
                    수정
                  </button>
                  <button onClick={() => remove(ev)} className="text-xs text-red-500">
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
