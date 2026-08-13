"use client";

import { useEffect, useMemo, useState } from "react";
import NavBar from "@/components/NavBar";
import CategoryBadge from "@/components/CategoryBadge";

type Email = {
  id: string;
  accountEmail: string;
  accountLabel: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
};

export default function MailPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [filter, setFilter] = useState("전체");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/gmail")
      .then((r) => r.json())
      .then((d) => setEmails(d.emails ?? []))
      .finally(() => setLoading(false));
  }, []);

  const labels = useMemo(() => ["전체", ...Array.from(new Set(emails.map((e) => e.accountLabel)))], [emails]);
  const visible = filter === "전체" ? emails : emails.filter((e) => e.accountLabel === filter);

  return (
    <div>
      <NavBar />
      <main className="mx-auto max-w-2xl px-3 py-6 sm:px-4 sm:py-8">
        <h1 className="mb-4 text-lg font-semibold">메일 (읽기 전용)</h1>

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
          <p className="text-sm text-gray-400">메일이 없어요.</p>
        ) : (
          <div className="space-y-2">
            {visible.map((e) => (
              <div key={`${e.accountEmail}-${e.id}`} className="rounded-xl border border-gray-200 bg-white px-4 py-3">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
                  <span className={`text-sm ${e.unread ? "font-semibold" : ""}`}>{e.subject}</span>
                  <CategoryBadge label={e.accountLabel} />
                </div>
                <div className="text-xs text-gray-400">{e.from}</div>
                <div className="mt-1 text-xs text-gray-500">{e.snippet}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
