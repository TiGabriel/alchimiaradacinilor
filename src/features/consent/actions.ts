"use server";

import { randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { z } from "zod";

import {
  CONSENT_COOKIE,
  CONSENT_MAX_AGE_DAYS,
  makeChoice,
  parseChoice,
  serializeChoice,
  type CookieChoice,
} from "@/lib/consent/cookie-choice";
import { recordCookieChoice } from "@/services/consent/consent";
import { getSetting } from "@/services/settings";

import { getCurrentUser, getRequestMeta } from "../auth/session";

const inputSchema = z.object({ analytics: z.boolean(), marketing: z.boolean() });

/**
 * Stores the visitor's cookie choice (a first-party, necessary cookie readable
 * by the page) and records it as consent — for signed-in customers also on
 * their account.
 */
export async function saveCookieChoiceAction(input: {
  analytics: boolean;
  marketing: boolean;
}): Promise<CookieChoice> {
  const parsed = inputSchema.parse(input);
  const { cookiePolicyVersion } = await getSetting("legal");
  const jar = await cookies();
  const previous = parseChoice(jar.get(CONSENT_COOKIE)?.value);
  const choice = makeChoice(
    parsed,
    cookiePolicyVersion,
    {
      id: randomBytes(12).toString("base64url"),
      aid: randomBytes(12).toString("base64url"),
    },
    previous,
  );
  jar.set(CONSENT_COOKIE, serializeChoice(choice), {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    httpOnly: false,
    maxAge: CONSENT_MAX_AGE_DAYS * 24 * 60 * 60,
  });
  const [user, meta] = await Promise.all([getCurrentUser(), getRequestMeta()]);
  await recordCookieChoice(
    {
      id: choice.id,
      analytics: choice.analytics,
      marketing: choice.marketing,
      policyVersion: cookiePolicyVersion,
    },
    user?.id ?? null,
    { source: "cookie-banner", ipHash: meta.ipHash, userAgent: meta.userAgent },
  );
  return choice;
}
