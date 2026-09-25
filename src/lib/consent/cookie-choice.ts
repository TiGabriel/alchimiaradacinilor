/**
 * The visitor's cookie choice, stored in a first-party "necessary" cookie —
 * pure (used by the browser, the server and tests).
 */
export const CONSENT_COOKIE = "ar_consent";
/** Re-ask after 12 months (and whenever the cookie policy version changes). */
export const CONSENT_MAX_AGE_DAYS = 365;

export type CookieCategory = "analytics" | "marketing";

export type CookieChoice = {
  /** Cookie policy version the choice was made under. */
  v: string;
  analytics: boolean;
  marketing: boolean;
  /** Unix seconds. */
  at: number;
  /** Random id linking the choice to its consent records (proof of consent). */
  id: string;
  /** Random analytics id — present only while analytics is allowed. */
  aid: string | null;
};

const ID = /^[A-Za-z0-9_-]{8,64}$/;

export function parseChoice(raw: string | null | undefined): CookieChoice | null {
  if (!raw) return null;
  try {
    // Server reads get the decoded value; document.cookie returns it URL-encoded.
    const text = raw.startsWith("{") ? raw : decodeURIComponent(raw);
    const value = JSON.parse(text) as Partial<CookieChoice>;
    if (
      typeof value.v !== "string" ||
      value.v.length > 40 ||
      typeof value.analytics !== "boolean" ||
      typeof value.marketing !== "boolean" ||
      typeof value.at !== "number" ||
      typeof value.id !== "string" ||
      !ID.test(value.id) ||
      (value.aid != null && (typeof value.aid !== "string" || !ID.test(value.aid)))
    )
      return null;
    return {
      v: value.v,
      analytics: value.analytics,
      marketing: value.marketing,
      at: value.at,
      id: value.id,
      aid: value.analytics ? (value.aid ?? null) : null,
    };
  } catch {
    return null;
  }
}

/** Plain JSON: Next's cookie API URL-encodes values itself. */
export function serializeChoice(choice: CookieChoice): string {
  return JSON.stringify(choice);
}

/** The banner shows until a choice exists for the current policy version and is not too old. */
export function needsChoice(
  choice: CookieChoice | null,
  policyVersion: string,
  now = Date.now(),
): boolean {
  if (!choice || choice.v !== policyVersion) return true;
  return now / 1000 - choice.at > CONSENT_MAX_AGE_DAYS * 24 * 60 * 60;
}

/** Optional categories are off unless explicitly allowed under the current policy. */
export function allows(
  choice: CookieChoice | null,
  category: CookieCategory,
  policyVersion: string,
  now = Date.now(),
): boolean {
  if (!choice || needsChoice(choice, policyVersion, now)) return false;
  return choice[category];
}

export function makeChoice(
  input: { analytics: boolean; marketing: boolean },
  policyVersion: string,
  ids: { id: string; aid: string },
  previous: CookieChoice | null = null,
  now = Date.now(),
): CookieChoice {
  return {
    v: policyVersion,
    analytics: input.analytics,
    marketing: input.marketing,
    at: Math.floor(now / 1000),
    id: previous?.id ?? ids.id,
    // Keep the analytics id while analytics stays allowed; drop it when withdrawn.
    aid: input.analytics ? (previous?.aid ?? ids.aid) : null,
  };
}
