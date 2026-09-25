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

export type DayPoint = { day: string; revenue: number; orders: number };

/** One point per day for the last `days` days (oldest first), zeros where nothing happened. */
export function fillDays(
  rows: Array<{ day: string; revenue: number; orders: number }>,
  days: number,
  today = new Date(),
): DayPoint[] {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  const out: DayPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = shopDay(new Date(today.getTime() - i * 86_400_000));
    const row = byDay.get(day);
    out.push({ day, revenue: row?.revenue ?? 0, orders: row?.orders ?? 0 });
  }
  return out;
}

export type FunnelStep = { name: string; label: string; count: number; rate: number | null };

/** Conversion between consecutive steps (null for the first or when the previous is 0). */
export function funnel(steps: Array<{ name: string; label: string; count: number }>): FunnelStep[] {
  return steps.map((step, i) => {
    const previous = steps[i - 1]?.count;
    return {
      ...step,
      rate: i === 0 || !previous ? null : Math.round((step.count / previous) * 1000) / 10,
    };
  });
}

export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}
