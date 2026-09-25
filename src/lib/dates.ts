/** Calendar days in the shop's time zone (Europe/Bucharest) — pure and unit-tested. */

const TZ = "Europe/Bucharest";

/** Offset of Bucharest from UTC at `date`, in minutes (120 in winter, 180 in summer). */
function offsetMinutes(date: Date): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return Math.round((asUtc - date.getTime()) / 60000);
}

/** The instant a Bucharest wall-clock time happens. */
export function bucharestTime(day: string, time = "00:00:00"): Date {
  const guess = new Date(`${day}T${time}Z`);
  const first = new Date(guess.getTime() - offsetMinutes(guess) * 60000);
  // Re-check around DST changes.
  return new Date(guess.getTime() - offsetMinutes(first) * 60000);
}

export const startOfBucharestDay = (day: string) => bucharestTime(day, "00:00:00");
export const endOfBucharestDay = (day: string) =>
  new Date(bucharestTime(day, "23:59:59").getTime() + 999);

/** YYYY-MM-DD of an instant, in Bucharest. */
export function bucharestDay(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
