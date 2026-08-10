// All date math is done in Asia/Seoul terms via simple offset arithmetic —
// good enough for day-granularity briefings.
export function todayKST(): string {
  const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return now.toISOString().slice(0, 10);
}

export function addDaysKST(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Returns [monday, sunday] of the week AFTER the current one (KST).
export function nextWeekRangeKST(): [string, string] {
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000);
  const dow = today.getUTCDay(); // 0=Sun..6=Sat
  const daysUntilNextMonday = ((8 - dow) % 7) || 7;
  const monday = addDaysKST(todayKST(), daysUntilNextMonday);
  const sunday = addDaysKST(monday, 6);
  return [monday, sunday];
}
