import { cookies } from "next/headers";

import { CONSENT_COOKIE } from "@/lib/consent/cookie-choice";
import { recordAnalyticsEvent } from "@/services/analytics/record";

const status = { stored: 204, ignored: 204, invalid: 400, limited: 429 } as const;

/** First-party analytics sink (see services/analytics/record.ts for the consent gate). */
export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") ?? 0) > 4096)
    return new Response(null, { status: 413 });
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const outcome = await recordAnalyticsEvent(body, (await cookies()).get(CONSENT_COOKIE)?.value);
  return new Response(null, { status: status[outcome] });
}
