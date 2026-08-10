"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const links = [
  { href: "/", label: "브리핑" },
  { href: "/calendar", label: "일정" },
  { href: "/mail", label: "메일" },
  { href: "/todos", label: "할 일" },
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
    <nav className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
      <div className="flex gap-4">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm ${
              pathname === l.href ? "font-semibold text-gray-900" : "text-gray-500"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <button onClick={logout} className="text-xs text-gray-400">
        로그아웃
      </button>
    </nav>
  );
}
