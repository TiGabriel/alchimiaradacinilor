/** Recent searches, stored only in this browser (localStorage). */

const KEY = "ar:recent-searches";
export const MAX_RECENT = 6;

/** Most recent first, de-duplicated case/diacritic-insensitively. Pure. */
export function pushRecent(list: string[], query: string, max = MAX_RECENT): string[] {
  const q = query.trim().replace(/\s+/g, " ");
  if (!q) return list;
  const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  return [q, ...list.filter((item) => fold(item) !== fold(q))].slice(0, max);
}

export function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string").slice(0, MAX_RECENT)
      : [];
  } catch {
    return [];
  }
}

export function writeRecent(list: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage unavailable (private mode, quota): recent searches are a convenience only.
  }
}
