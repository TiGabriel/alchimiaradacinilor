import { describe, expect, it, vi } from "vitest";

import { db } from "@/lib/db";
import type {
  BrevoCampaignsClient,
  BrevoCampaignState,
  BrevoResult,
} from "@/services/newsletter/brevo-campaigns";
import { brevoReadiness, sendCampaignViaBrevo } from "@/services/newsletter/brevo-send";
import { sendCampaign } from "@/services/newsletter/newsletter";

const config = {
  apiKey: "k",
  listId: 3,
  senderEmail: "noreply@alchimiaradacinilor.ro",
  senderName: "Alchimia Rădăcinilor",
};
const html = '<html><body>Bună! <a href="{{ unsubscribe }}">Dezabonare</a></body></html>';

const ok = <T>(data: T): BrevoResult<T> => ({ ok: true, data });
const fail = (error: string): BrevoResult<never> => ({ ok: false, error });

/** A Brevo client whose answers each test chooses; every call is recorded. */
function fakeClient(overrides: Partial<Record<keyof BrevoCampaignsClient, unknown>> = {}) {
  const client = {
    create: vi.fn(async () => ok(501)),
    update: vi.fn(async () => ok(null)),
    sendNow: vi.fn(async () => ok(null)),
    get: vi.fn(async () =>
      ok<BrevoCampaignState>({ status: "draft", sentDate: null, stats: null }),
    ),
    senders: vi.fn(async () => ok([{ email: config.senderEmail, active: true }])),
    listRecipients: vi.fn(async () => ok(12)),
    ...overrides,
  };
  return client as typeof client & BrevoCampaignsClient;
}

const draft = (data: { html?: string | null; brevoCampaignId?: number } = {}) =>
  db.newsletterCampaign.create({
    data: {
      subject: "15% pentru ritualurile tale de toamnă",
      preheader: "Cu codul TOAMNA15",
      heading: "Seri lungi, arome calde",
      body: "",
      html: data.html === undefined ? html : data.html,
      brevoCampaignId: data.brevoCampaignId,
    },
  });

describe("sending a designed campaign through Brevo", () => {
  it("creates the Brevo campaign, sends it and records it as sent", async () => {
    const campaign = await draft();
    const client = fakeClient();

    expect(await sendCampaignViaBrevo(campaign.id, { client, config })).toEqual({
      brevoCampaignId: 501,
      recipients: 12,
    });
    expect(client.create).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: campaign.subject,
        previewText: "Cu codul TOAMNA15",
        html,
        sender: { name: config.senderName, email: config.senderEmail },
        listId: 3,
      }),
    );
    expect(client.sendNow).toHaveBeenCalledWith(501);
    const saved = await db.newsletterCampaign.findUniqueOrThrow({ where: { id: campaign.id } });
    expect(saved).toMatchObject({ status: "SENT", brevoCampaignId: 501, recipientCount: 12 });
    expect(saved.sentAt).toBeInstanceOf(Date);
  });

  it("never sends a campaign twice", async () => {
    const campaign = await draft();
    const client = fakeClient();
    await sendCampaignViaBrevo(campaign.id, { client, config });

    await expect(sendCampaignViaBrevo(campaign.id, { client, config })).rejects.toThrow(
      "Campania a fost deja trimisă.",
    );
    expect(client.sendNow).toHaveBeenCalledTimes(1);
  });

  it("lets only one of two simultaneous clicks through", async () => {
    const campaign = await draft();
    const client = fakeClient();
    const results = await Promise.allSettled([
      sendCampaignViaBrevo(campaign.id, { client, config }),
      sendCampaignViaBrevo(campaign.id, { client, config }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(client.create).toHaveBeenCalledTimes(1);
    expect(client.sendNow).toHaveBeenCalledTimes(1);
  });

  it("reports a refused send, keeps the draft and reuses the Brevo campaign on retry", async () => {
    const campaign = await draft();
    const refused = fakeClient({
      sendNow: vi.fn(async () => fail("Brevo nu acceptă expeditorul.")),
    });
    await expect(sendCampaignViaBrevo(campaign.id, { client: refused, config })).rejects.toThrow(
      "Brevo nu acceptă expeditorul.",
    );
    let saved = await db.newsletterCampaign.findUniqueOrThrow({ where: { id: campaign.id } });
    expect(saved).toMatchObject({ status: "DRAFT", brevoCampaignId: 501, sentAt: null });

    const retry = fakeClient();
    await sendCampaignViaBrevo(campaign.id, { client: retry, config });
    expect(retry.create).not.toHaveBeenCalled();
    expect(retry.update).toHaveBeenCalledWith(501, expect.objectContaining({ html }));
    expect(retry.sendNow).toHaveBeenCalledWith(501);
    saved = await db.newsletterCampaign.findUniqueOrThrow({ where: { id: campaign.id } });
    expect(saved.status).toBe("SENT");
  });

  it("records a send whose answer was lost instead of sending it again", async () => {
    const campaign = await draft({ brevoCampaignId: 777 });
    const sentDate = new Date("2026-10-12T08:00:00.000Z");
    const client = fakeClient({
      get: vi.fn(async () =>
        ok<BrevoCampaignState>({
          status: "sent",
          sentDate,
          stats: { sent: 9, delivered: 9, opens: 0, clicks: 0, unsubscribes: 0, bounces: 0 },
        }),
      ),
    });
    expect(await sendCampaignViaBrevo(campaign.id, { client, config })).toEqual({
      brevoCampaignId: 777,
      recipients: 9,
    });
    expect(client.sendNow).not.toHaveBeenCalled();
    const saved = await db.newsletterCampaign.findUniqueOrThrow({ where: { id: campaign.id } });
    expect(saved).toMatchObject({ status: "SENT", sentAt: sentDate, recipientCount: 9 });
  });

  it("refuses a campaign without designed HTML", async () => {
    const campaign = await draft({ html: null });
    const client = fakeClient();
    await expect(sendCampaignViaBrevo(campaign.id, { client, config })).rejects.toThrow(/HTML/);
    expect(client.create).not.toHaveBeenCalled();
  });

  it("keeps designed campaigns away from the site's plain sender", async () => {
    const campaign = await draft();
    await expect(sendCampaign(campaign.id)).rejects.toThrow(/prin Brevo/);
    const saved = await db.newsletterCampaign.findUniqueOrThrow({ where: { id: campaign.id } });
    expect(saved.status).toBe("DRAFT");
  });
});

describe("brevoReadiness", () => {
  it("is ready with an active sender and contacts on the list", async () => {
    expect(await brevoReadiness({ client: fakeClient(), config })).toEqual({
      problems: [],
      recipients: 12,
    });
  });

  it("explains an unverified sender and an empty list", async () => {
    const result = await brevoReadiness({
      client: fakeClient({
        senders: vi.fn(async () => ok([{ email: "alt@exemplu.ro", active: true }])),
        listRecipients: vi.fn(async () => ok(0)),
      }),
      config,
    });
    expect(result.problems).toHaveLength(2);
    expect(result.problems[0]).toContain("noreply@alchimiaradacinilor.ro");
    expect(result.problems[1]).toContain("#3");
  });
});
