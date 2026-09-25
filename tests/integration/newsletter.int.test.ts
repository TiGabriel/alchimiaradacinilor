import { describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";
import { getNewsletterState, setNewsletterConsent } from "@/services/consent/consent";
import {
  confirmSubscription,
  countSegment,
  requestSubscription,
  sendCampaign,
  subscriberUnsubscribeLinks,
  unsubscribeWithSignature,
} from "@/services/newsletter/newsletter";

import { makeVerifiedUser, meta } from "./helpers";

/** Captures links printed by the console email provider. */
function captureLinks() {
  const info = vi.spyOn(console, "info").mockImplementation(() => {});
  return () =>
    info.mock.calls.flatMap((args) =>
      [...String(args[0]).matchAll(/https?:\/\/\S+/g)].map((m) => m[0]),
    );
}

async function subscribeAndConfirm(email: string) {
  const links = captureLinks();
  await requestSubscription({ email, source: "footer" });
  const url = new URL(links().findLast((l) => l.includes("/newsletter/confirmare"))!);
  expect(await confirmSubscription(url.searchParams.get("token")!, meta)).toBe("confirmed");
  return db.newsletterSubscriber.findUniqueOrThrow({ where: { email } });
}

describe("newsletter double opt-in", () => {
  it("stays pending until the emailed link is confirmed, then records consent", async () => {
    const links = captureLinks();
    expect(await requestSubscription({ email: "ana@example.ro", source: "homepage" })).toEqual({
      status: "confirmation-sent",
    });
    let sub = await db.newsletterSubscriber.findUniqueOrThrow({
      where: { email: "ana@example.ro" },
    });
    expect(sub).toMatchObject({ status: "PENDING", source: "homepage" });
    expect(sub.confirmTokenHash).not.toBeNull();
    expect(await db.consentRecord.count()).toBe(0);

    const token = new URL(links().findLast((l) => l.includes("confirmare"))!).searchParams.get(
      "token",
    )!;
    expect(sub.confirmTokenHash).not.toBe(token); // only the hash is stored
    expect(await confirmSubscription("x".repeat(43), meta)).toBe("invalid");
    expect(await confirmSubscription(token, meta)).toBe("confirmed");
    expect(await confirmSubscription(token, meta)).toBe("invalid"); // single use

    sub = await db.newsletterSubscriber.findUniqueOrThrow({ where: { id: sub.id } });
    expect(sub).toMatchObject({ status: "ACTIVE", confirmTokenHash: null });
    expect(
      await db.consentRecord.findFirst({ where: { subscriberId: sub.id, purpose: "NEWSLETTER" } }),
    ).toMatchObject({ granted: true });
  });

  it("does not reveal or disturb an already active subscription", async () => {
    const sub = await subscribeAndConfirm("ana@example.ro");
    expect(await requestSubscription({ email: "ana@example.ro", source: "footer" })).toEqual({
      status: "confirmation-sent",
    });
    expect(
      await db.newsletterSubscriber.findUniqueOrThrow({ where: { id: sub.id } }),
    ).toMatchObject({ status: "ACTIVE" });
  });

  it("rejects expired confirmation links", async () => {
    const links = captureLinks();
    await requestSubscription({ email: "ana@example.ro", source: "footer" });
    await db.newsletterSubscriber.update({
      where: { email: "ana@example.ro" },
      data: { confirmTokenExpiresAt: new Date(Date.now() - 1000) },
    });
    const token = new URL(links().findLast((l) => l.includes("confirmare"))!).searchParams.get(
      "token",
    )!;
    expect(await confirmSubscription(token, meta)).toBe("invalid");
  });
});

describe("unsubscribe", () => {
  it("works with a signed link only, is idempotent and records the withdrawal", async () => {
    const sub = await subscribeAndConfirm("ana@example.ro");
    const link = new URL(subscriberUnsubscribeLinks(sub.id).page);
    expect(await unsubscribeWithSignature(sub.id, "forged", meta)).toBe("invalid");
    expect(await unsubscribeWithSignature(sub.id, link.searchParams.get("t")!, meta)).toBe(
      "unsubscribed",
    );
    expect(await unsubscribeWithSignature(sub.id, link.searchParams.get("t")!, meta)).toBe(
      "already",
    );
    expect(
      await db.newsletterSubscriber.findUniqueOrThrow({ where: { id: sub.id } }),
    ).toMatchObject({ status: "UNSUBSCRIBED" });
    const last = await db.consentRecord.findFirst({
      where: { subscriberId: sub.id },
      orderBy: { createdAt: "desc" },
    });
    expect(last).toMatchObject({ purpose: "NEWSLETTER", granted: false });
  });

  it("keeps the account preferences in sync", async () => {
    const user = await makeVerifiedUser({ email: "ioana@example.ro" });
    await setNewsletterConsent(user.id, true, meta);
    expect(await getNewsletterState(user.id)).toMatchObject({ subscribed: true, status: "ACTIVE" });

    const sub = await db.newsletterSubscriber.findUniqueOrThrow({ where: { userId: user.id } });
    const t = new URL(subscriberUnsubscribeLinks(sub.id).page).searchParams.get("t")!;
    await unsubscribeWithSignature(sub.id, t, meta);
    const state = await getNewsletterState(user.id);
    expect(state).toMatchObject({ subscribed: false, status: "UNSUBSCRIBED" });
    expect(state.withdrawnAt).not.toBeNull();
  });

  it("links a confirmed guest subscription to an existing account", async () => {
    const user = await makeVerifiedUser({ email: "ioana@example.ro" });
    await subscribeAndConfirm("ioana@example.ro");
    expect(await getNewsletterState(user.id)).toMatchObject({ subscribed: true });
  });
});

describe("campaigns", () => {
  it("send only to active subscribers of the segment, with an unsubscribe header", async () => {
    await subscribeAndConfirm("a@example.ro");
    const b = await subscribeAndConfirm("b@example.ro");
    await db.newsletterSubscriber.update({ where: { id: b.id }, data: { interests: ["seara"] } });
    await requestSubscription({ email: "pending@example.ro", source: "footer" });

    expect(await countSegment({})).toBe(2);
    expect(await countSegment({ interests: ["seara"] })).toBe(1);

    const campaign = await db.newsletterCampaign.create({
      data: {
        subject: "Ritualuri de toamnă",
        heading: "Seri mai lungi",
        body: "Primul paragraf.\n\nAl doilea paragraf.",
        segment: { interests: ["seara"] },
      },
    });
    const sent = captureLinks();
    const result = await sendCampaign(campaign.id);
    expect(result).toMatchObject({ status: "SENT", recipientCount: 1, deliveredCount: 1 });
    expect(sent().some((l) => l.includes(`/newsletter/dezabonare?s=${b.id}`))).toBe(true);
    await expect(sendCampaign(campaign.id)).rejects.toThrow("deja trimisă");
  });
});
