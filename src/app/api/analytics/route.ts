import { cookies } from "next/headers";

import { CONSENT_COOKIE } from "@/lib/consent/cookie-choice";
import { clientIp, isSameOrigin } from "@/lib/request";
import { recordAnalyticsEvent } from "@/services/analytics/record";
import { limiters } from "@/services/auth/rate-limit";

const status = { stored: 204, ignored: 204, invalid: 400, limited: 429 } as const;

/** First-party analytics sink (see services/analytics/record.ts for the consent gate). */
export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new Response(null, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 4096)
    return new Response(null, { status: 413 });
  // Per-visitor ids are chosen by the client, so floods are also capped per IP.
  if (!limiters.analyticsByIp.check(clientIp(request.headers) ?? "unknown").allowed)
    return new Response(null, { status: 429 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const outcome = await recordAnalyticsEvent(body, (await cookies()).get(CONSENT_COOKIE)?.value);
  return new Response(null, { status: status[outcome] });
}
