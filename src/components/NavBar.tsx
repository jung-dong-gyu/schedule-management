"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "홈" },
  { href: "/calendar", label: "일정" },
  { href: "/routines", label: "루틴" },
  { href: "/mail", label: "메일" },
  { href: "/briefing", label: "브리핑" },
  { href: "/settings", label: "설정" },
];

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-gray-200 bg-white px-3 py-2 sm:px-4 sm:py-3">
      <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto sm:gap-4">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`shrink-0 rounded-lg px-2.5 py-1.5 text-sm ${
              pathname === l.href ? "bg-gray-100 font-semibold text-gray-900" : "text-gray-500"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <button onClick={logout} className="shrink-0 px-1 text-xs text-gray-400">
        로그아웃
      </button>
    </nav>
  );
}
