import { redirect } from "next/navigation";

// 할 일은 홈(/)으로 통합됐어요 — 예전 북마크를 위한 리다이렉트.
export default function TodosRedirect() {
  redirect("/");
}
