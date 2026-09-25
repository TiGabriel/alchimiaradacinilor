import "server-only";

import { db } from "@/lib/db";

import { hasPersonalizationConsent } from "../consent/consent";

/**
 * First-party personalisation signal: the products a signed-in customer viewed.
 * Stored only with PERSONALIZATION consent (and deleted when it is withdrawn).
 */
export async function recordProductView(userId: string, productId: string) {
  try {
    if (!(await hasPersonalizationConsent(userId))) return;
    await db.productView.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: { viewedAt: new Date() },
    });
  } catch (error) {
    console.warn("[signals] product view not recorded", error);
  }
}
