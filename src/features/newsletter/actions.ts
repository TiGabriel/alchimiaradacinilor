"use server";

import { limiters, retryAfterText } from "@/services/auth/rate-limit";
import { setNewsletterConsent } from "@/services/consent/consent";
import {
  confirmSubscription,
  requestSubscription,
  unsubscribeWithSignature,
  type ConfirmOutcome,
  type UnsubscribeOutcome,
} from "@/services/newsletter/newsletter";
import { subscribeSchema } from "@/validation/newsletter";

import { getCurrentUser, getRequestMeta } from "../auth/session";

export type SubscribeResult = { ok: true; message: string } | { ok: false; error: string };

export async function subscribeNewsletterAction(input: {
  email: string;
  source?: string;
}): Promise<SubscribeResult> {
  const parsed = subscribeSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Adresă invalidă." };
  const meta = await getRequestMeta();
  const limit = limiters.newsletterByIp.check(`newsletter:${meta.ipHash ?? "unknown"}`);
  if (!limit.allowed)
    return {
      ok: false,
      error: `Prea multe încercări. Mai încearcă peste ${retryAfterText(limit.retryAfterMs)}.`,
    };

  // A signed-in customer subscribing their own verified address needs no second confirmation.
  const user = await getCurrentUser();
  if (user?.emailVerified && user.email === parsed.data.email) {
    await setNewsletterConsent(user.id, true, {
      source: parsed.data.source,
      ipHash: meta.ipHash,
      userAgent: meta.userAgent,
    });
    return { ok: true, message: "Te-ai abonat la newsletter. Mulțumim!" };
  }

  const outcome = await requestSubscription({
    email: parsed.data.email,
    source: parsed.data.source,
  });
  return outcome.status === "confirmation-sent"
    ? {
        ok: true,
        message: `Ți-am trimis un email la ${parsed.data.email}. Confirmă abonarea din linkul primit.`,
      }
    : {
        ok: false,
        error: "Abonarea la newsletter nu este disponibilă momentan. Te rugăm să revii curând.",
      };
}

export async function confirmNewsletterAction(token: string): Promise<ConfirmOutcome> {
  const meta = await getRequestMeta();
  return confirmSubscription(String(token), {
    source: "newsletter/confirmare",
    ipHash: meta.ipHash,
    userAgent: meta.userAgent,
  });
}

export async function unsubscribeNewsletterAction(
  subscriberId: string,
  signature: string,
): Promise<UnsubscribeOutcome> {
  const meta = await getRequestMeta();
  return unsubscribeWithSignature(String(subscriberId), String(signature), {
    source: "newsletter/dezabonare",
    ipHash: meta.ipHash,
    userAgent: meta.userAgent,
  });
}
