import "server-only";

import { db } from "@/lib/db";

/** Interests a campaign can target: need and aroma slugs. */
export async function campaignOptions() {
  const [needs, aromas, sources] = await Promise.all([
    db.need.findMany({ orderBy: { position: "asc" }, select: { slug: true, name: true } }),
    db.aromaProfile.findMany({ orderBy: { position: "asc" }, select: { slug: true, name: true } }),
    db.newsletterSubscriber.groupBy({ by: ["source"] }),
  ]);
  return {
    interests: [...needs, ...aromas],
    sources: sources.map((s) => s.source).filter((s): s is string => Boolean(s)),
  };
}
