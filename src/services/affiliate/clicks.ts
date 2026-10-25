import "server-only";

import { db } from "@/lib/db";
import { getSetting } from "@/services/settings";

import { shopDay } from "../admin/metrics";

import { isAllowedReferralUrl } from "./links";

export type OutboundTarget =
  | { kind: "referral"; productId: string; url: string }
  /** Active product without a usable link: back to its page. */
  | { kind: "product"; slug: string }
  | { kind: "missing" };

/** Where `/spre-doterra/[slug]` sends the visitor. The link is re-checked against the setting. */
export async function resolveOutbound(slug: string): Promise<OutboundTarget> {
  const product = await db.product.findFirst({
    where: { slug, active: true },
    select: { id: true, slug: true, referralUrl: true },
  });
  if (!product) return { kind: "missing" };
  const { allowedHosts } = await getSetting("affiliate");
  if (!product.referralUrl || !isAllowedReferralUrl(product.referralUrl, allowedHosts))
    return { kind: "product", slug: product.slug };
  return { kind: "referral", productId: product.id, url: product.referralUrl };
}

/** +1 for today (Europe/Bucharest); one statement, safe under concurrent clicks. */
export async function recordOutboundClick(productId: string, source: string, now = new Date()) {
  const day = shopDay(now);
  await db.$executeRaw`
    INSERT INTO "outbound_clicks_daily" ("productId", "day", "source", "count")
    VALUES (${productId}, ${day}::date, ${source}, 1)
    ON CONFLICT ("productId", "day", "source")
    DO UPDATE SET "count" = "outbound_clicks_daily"."count" + 1`;
}
