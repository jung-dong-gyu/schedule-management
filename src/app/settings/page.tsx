"use client";

import { useEffect, useState } from "react";
import NavBar from "@/components/NavBar";
import CategoryBadge from "@/components/CategoryBadge";

type Account = { email: string; label: string; created_at: string };

const LABELS = ["통합", "업무", "개인", "취미", "기타"];

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [label, setLabel] = useState("업무");
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/accounts");
    const { accounts } = await res.json();
    setAccounts(accounts ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function disconnect(email: string) {
    if (!confirm(`${email} 연결을 해제할까요?`)) return;
    await fetch("/api/auth/google/disconnect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    load();
  }

  return (
    <div>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-lg font-semibold">설정 — 구글 계정</h1>

        <div className="mb-6 flex items-center gap-2">
          <select
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {LABELS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <a
            href={`/api/auth/google/connect?label=${encodeURIComponent(label)}`}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white"
          >
            + 구글 계정 연결
          </a>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">불러오는 중...</p>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-gray-400">아직 연결된 계정이 없어요.</p>
        ) : (
          <div className="space-y-2">
            {accounts.map((a) => (
              <div
                key={a.email}
                className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <CategoryBadge label={a.label} />
                  <span className="text-sm">{a.email}</span>
                </div>
                <button onClick={() => disconnect(a.email)} className="text-xs text-red-500">
                  연결 해제
                </button>
              </div>
            ))}
          </div>
        )}

        <p className="mt-8 text-xs text-gray-400">
          "연결 해제"는 이 앱의 접근 권한만 제거해요. 필요하면 구글 계정의 "타사 앱 액세스"에서도 직접 제거할 수 있어요.
        </p>
      </main>
    </div>
  );
}
