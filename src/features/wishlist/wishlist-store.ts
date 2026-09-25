/**
 * Guest wishlist persisted in localStorage, exposed as an external store
 * (useSyncExternalStore): hydration-safe and synced across tabs.
 */
import { MAX_WISHLIST_ITEMS } from "@/services/wishlist/merge";

const KEY = "ar:wishlist";
const EMPTY: readonly string[] = Object.freeze([]);

let cacheRaw: string | null = null;
let cacheValue: readonly string[] = EMPTY;
const listeners = new Set<() => void>();

/** Parses stored JSON defensively (ids only, de-duplicated, capped). Pure. */
export function parseWishlist(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return [
      ...new Set(parsed.filter((v): v is string => typeof v === "string" && v.length <= 64)),
    ].slice(0, MAX_WISHLIST_ITEMS);
  } catch {
    return [];
  }
}

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function getWishlistSnapshot(): readonly string[] {
  const raw = readRaw();
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cacheValue = Object.freeze(parseWishlist(raw));
  }
  return cacheValue;
}

export function getWishlistServerSnapshot(): readonly string[] {
  return EMPTY;
}

export function subscribeWishlist(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function writeWishlist(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids.slice(0, MAX_WISHLIST_ITEMS)));
  } catch {
    // Storage unavailable: the wishlist then lives only for this page view.
  }
  listeners.forEach((l) => l());
}

/** Newest first. Pure. */
export function toggleId(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((i) => i !== id) : [id, ...ids].slice(0, MAX_WISHLIST_ITEMS);
}
