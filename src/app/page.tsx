import NavBar from "@/components/NavBar";
import TodayEventsSection from "@/components/TodayEventsSection";
import TodoSection from "@/components/TodoSection";

export default function HomePage() {
  return (
    <div>
      <NavBar />
      <main className="mx-auto max-w-2xl px-3 py-6 sm:px-4 sm:py-8">
        <TodayEventsSection />
        <div className="my-8 border-t border-gray-200" />
        <TodoSection />
      </main>
    </div>
  );
}
