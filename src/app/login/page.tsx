"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 shadow-sm"
      >
        <h1 className="mb-1 text-xl font-semibold">Jarvis Assistant</h1>
        <p className="mb-6 text-sm text-gray-500">개인 대시보드에 로그인</p>

        <label className="mb-1 block text-sm text-gray-600">이메일</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />

        <label className="mb-1 block text-sm text-gray-600">비밀번호</label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-6 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-gray-900 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        <p className="mt-4 text-xs text-gray-400">
          계정은 Supabase 대시보드(Authentication → Users)에서 미리 한 번 만들어두면 돼요.
        </p>
      </form>
    </div>
  );
}
