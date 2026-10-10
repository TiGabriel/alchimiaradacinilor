import "server-only";

import { db } from "@/lib/db";
import { env } from "@/lib/env";

import { brevoProvider, type MarketingProvider } from "./brevo";

/** The configured marketing provider, or null when Brevo is not set up (sync is then skipped). */
export function marketingProvider(): MarketingProvider | null {
  const { BREVO_API_KEY, BREVO_LIST_ID } = env();
  return BREVO_API_KEY && BREVO_LIST_ID
    ? brevoProvider({ apiKey: BREVO_API_KEY, listId: BREVO_LIST_ID })
    : null;
}

/**
 * Mirrors one subscriber's current state (read from the database, the source
 * of truth) to the marketing provider: ACTIVE → on the list, UNSUBSCRIBED →
 * off the list and blocklisted, PENDING → nothing yet. Never throws and never
 * blocks the visitor's action: a failure is logged and repaired by
 * `pnpm newsletter:sync`.
 */
export async function syncSubscriber(
  email: string,
  options: { freshConsent?: boolean } = {},
): Promise<void> {
  const provider = marketingProvider();
  if (!provider) return;
  try {
    const subscriber = await db.newsletterSubscriber.findUnique({
      where: { email },
      select: {
        email: true,
        status: true,
        source: true,
        firstName: true,
        confirmedAt: true,
        user: { select: { firstName: true } },
      },
    });
    if (!subscriber || subscriber.status === "PENDING") return;
    const result =
      subscriber.status === "ACTIVE"
        ? await provider.subscribe(
            {
              email: subscriber.email,
              firstName: subscriber.firstName ?? subscriber.user?.firstName ?? null,
              source: subscriber.source,
              confirmedAt: subscriber.confirmedAt,
            },
            options,
          )
        : await provider.unsubscribe(subscriber.email);
    if (!result.ok) console.error(`[newsletter] ${provider.name} sync failed:`, result.error);
  } catch (error) {
    console.error("[newsletter] marketing sync failed", error);
  }
}
