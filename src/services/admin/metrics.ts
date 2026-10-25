/** Dashboard helpers — pure and unit-tested. */

/** YYYY-MM-DD in Europe/Bucharest. */
export function shopDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Bucharest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export type DayPoint = { day: string; count: number };

/** One point per day for the last `days` days (oldest first), zeros where nothing happened. */
export function fillDays(rows: DayPoint[], days: number, today = new Date()): DayPoint[] {
  const byDay = new Map(rows.map((r) => [r.day, r.count]));
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = shopDay(new Date(today.getTime() - i * 86_400_000));
    out.push({ day, count: byDay.get(day) ?? 0 });
  }
  return out;
}

/** Share of `part` in `whole`, in percent with one decimal (null when `whole` is 0). */
export function rate(part: number, whole: number): number | null {
  if (whole === 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
