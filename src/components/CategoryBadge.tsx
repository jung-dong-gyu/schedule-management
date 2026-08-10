const COLORS: Record<string, string> = {
  업무: "bg-blue-100 text-blue-700",
  개인: "bg-green-100 text-green-700",
  취미: "bg-purple-100 text-purple-700",
  건강: "bg-pink-100 text-pink-700",
  재정: "bg-yellow-100 text-yellow-700",
  학습: "bg-orange-100 text-orange-700",
  관계: "bg-amber-100 text-amber-800",
  통합: "bg-gray-200 text-gray-700",
  기타: "bg-gray-100 text-gray-600",
};

export default function CategoryBadge({ label }: { label: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${COLORS[label] ?? COLORS["기타"]}`}>
      {label}
    </span>
  );
}
