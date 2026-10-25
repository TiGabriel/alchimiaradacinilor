import type { NextRequest } from "next/server";

import { clientIp } from "@/lib/request";
import { isLikelyBot, parseOutboundSource } from "@/services/affiliate/links";
import { recordOutboundClick, resolveOutbound } from "@/services/affiliate/clicks";
import { limiters } from "@/services/auth/rate-limit";

const headers = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

function redirect(location: string) {
  return new Response(null, { status: 302, headers: { ...headers, Location: location } });
}

async function target(request: NextRequest, slug: string, count: boolean) {
  const resolved = await resolveOutbound(slug);
  if (resolved.kind === "missing") return redirect(new URL("/produse", request.url).toString());
  if (resolved.kind === "product")
    return redirect(new URL(`/produs/${resolved.slug}`, request.url).toString());

  const prefetch = /prefetch/i.test(
    request.headers.get("sec-purpose") ?? request.headers.get("purpose") ?? "",
  );
  const counted =
    count &&
    !prefetch &&
    !isLikelyBot(request.headers.get("user-agent")) &&
    limiters.outboundByIp.check(clientIp(request.headers) ?? "unknown").allowed;
  if (counted) {
    // A failed count never stops the visitor on their way to doTERRA.
    await recordOutboundClick(
      resolved.productId,
      parseOutboundSource(request.nextUrl.searchParams.get("sursa")),
    ).catch((error) => console.error("[outbound] Could not count the click:", error));
  }
  return redirect(resolved.url);
}

/** Counts a click on "Cumpără de pe doTERRA" (no personal data, no cookie), then redirects. */
export async function GET(request: NextRequest, ctx: RouteContext<"/spre-doterra/[slug]">) {
  return target(request, (await ctx.params).slug, true);
}

/** Link checkers and previews: same answer, never counted. */
export async function HEAD(request: NextRequest, ctx: RouteContext<"/spre-doterra/[slug]">) {
  return target(request, (await ctx.params).slug, false);
}
