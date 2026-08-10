import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Jarvis Assistant",
  description: "개인 일정 · 이메일 · 브리핑 대시보드",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#111827",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
