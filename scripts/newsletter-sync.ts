/**
 * Mirrors the site's newsletter subscribers to the Brevo list (first import,
 * or repair after a failed sync):
 *
 *   pnpm newsletter:sync           # dry run: counts only, nothing is sent
 *   pnpm newsletter:sync --apply   # pushes the changes to Brevo
 *
 * ACTIVE subscribers are added to BREVO_LIST_ID, UNSUBSCRIBED ones are removed
 * and blocklisted, PENDING ones (never confirmed) are left out. A contact that
 * Brevo has blocklisted (unsubscribed or complained there) stays blocklisted:
 * this script never lifts a suppression. No email is sent by this script.
 */
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { brevoProvider } from "../src/services/newsletter/brevo";

async function main() {
  const apply = process.argv.includes("--apply");
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const apiKey = process.env.BREVO_API_KEY;
  const listId = Number(process.env.BREVO_LIST_ID);
  if (apply && (!apiKey || !Number.isInteger(listId) || listId <= 0))
    throw new Error("Set BREVO_API_KEY and BREVO_LIST_ID to apply the sync.");

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const subscribers = await db.newsletterSubscriber.findMany({
      where: { status: { in: ["ACTIVE", "UNSUBSCRIBED"] } },
      orderBy: { createdAt: "asc" },
      select: {
        email: true,
        status: true,
        source: true,
        firstName: true,
        confirmedAt: true,
        user: { select: { firstName: true } },
      },
    });
    const active = subscribers.filter((s) => s.status === "ACTIVE");
    console.info(
      `${active.length} active, ${subscribers.length - active.length} unsubscribed${apply ? "" : " (dry run — add --apply to sync)"}`,
    );
    if (!apply) return;

    const brevo = brevoProvider({ apiKey: apiKey!, listId });
    let failed = 0;
    for (const s of subscribers) {
      const result =
        s.status === "ACTIVE"
          ? await brevo.subscribe({
              email: s.email,
              firstName: s.firstName ?? s.user?.firstName ?? null,
              source: s.source,
              confirmedAt: s.confirmedAt,
            })
          : await brevo.unsubscribe(s.email);
      if (!result.ok) {
        failed += 1;
        console.error(`${s.email}: ${result.error}`);
      }
      // Stay well under Brevo's API rate limits.
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    console.info(`Done: ${subscribers.length - failed} synced, ${failed} failed.`);
    if (failed > 0) process.exitCode = 1;
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
