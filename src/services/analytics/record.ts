import "server-only";

import { analyticsPayloadSchema } from "@/lib/analytics/schema";
import { allows, parseChoice } from "@/lib/consent/cookie-choice";
import { db } from "@/lib/db";

import { SlidingWindowLimiter } from "../auth/rate-limit";
import { getSetting } from "../settings";

const perVisitor = new SlidingWindowLimiter(120, 60 * 1000);

export type RecordOutcome = "stored" | "ignored" | "invalid" | "limited";

/**
 * Stores a first-party analytics event only when the visitor's consent cookie
 * allows analytics under the current policy and carries the same anonymous id.
 * No IP, user agent or account id is ever stored.
 */
export async function recordAnalyticsEvent(
  body: unknown,
  consentCookie: string | undefined,
): Promise<RecordOutcome> {
  const parsed = analyticsPayloadSchema.safeParse(body);
  if (!parsed.success) return "invalid";
  const { cookiePolicyVersion } = await getSetting("legal");
  const choice = parseChoice(consentCookie);
  if (!allows(choice, "analytics", cookiePolicyVersion) || choice?.aid !== parsed.data.anonymousId)
    return "ignored";
  if (!perVisitor.check(parsed.data.anonymousId).allowed) return "limited";
  await db.analyticsEvent.create({
    data: {
      name: parsed.data.name,
      anonymousId: parsed.data.anonymousId,
      path: parsed.data.path ?? null,
      props: parsed.data.props,
    },
  });
  return "stored";
}
