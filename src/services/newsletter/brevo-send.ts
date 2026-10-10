import "server-only";

import { db } from "@/lib/db";
import { env } from "@/lib/env";

import { getSettings } from "../settings";

import {
  brevoCampaigns,
  type BrevoCampaignContent,
  type BrevoCampaignsClient,
} from "./brevo-campaigns";
import { CampaignError } from "./newsletter";

/** A send that stopped longer ago than this (a crashed request) can be retried. */
const STALE_SENDING_MS = 10 * 60 * 1000;

export type BrevoSendConfig = {
  apiKey: string;
  listId: number;
  senderEmail: string;
  senderName: string;
};

type Deps = { client?: BrevoCampaignsClient; config?: BrevoSendConfig };

/** Environment variables still missing for sending through Brevo. */
export function missingBrevoSendConfig(): string[] {
  const e = env();
  return [
    ["BREVO_API_KEY", e.BREVO_API_KEY],
    ["BREVO_LIST_ID", e.BREVO_LIST_ID],
    ["BREVO_SENDER_EMAIL", e.BREVO_SENDER_EMAIL],
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name as string);
}

async function configFromEnv(): Promise<BrevoSendConfig | null> {
  const e = env();
  if (!e.BREVO_API_KEY || !e.BREVO_LIST_ID || !e.BREVO_SENDER_EMAIL) return null;
  const { brand, email } = await getSettings();
  return {
    apiKey: e.BREVO_API_KEY,
    listId: e.BREVO_LIST_ID,
    senderEmail: e.BREVO_SENDER_EMAIL.toLowerCase(),
    senderName: e.BREVO_SENDER_NAME ?? email.senderName ?? brand.siteName,
  };
}

async function resolve(deps: Deps) {
  const config = deps.config ?? (await configFromEnv());
  if (!config)
    throw new CampaignError(
      `Trimiterea prin Brevo nu este configurată. Lipsesc: ${missingBrevoSendConfig().join(", ")}.`,
    );
  return { config, client: deps.client ?? brevoCampaigns({ apiKey: config.apiKey }) };
}

export type BrevoReadiness = {
  /** Problems that block sending, in Romanian; empty when everything is ready. */
  problems: string[];
  /** Contacts on the Brevo list who would receive the campaign (null when unknown). */
  recipients: number | null;
};

/** Checks, against Brevo itself, that a campaign could be sent now. Never throws. */
export async function brevoReadiness(deps: Deps = {}): Promise<BrevoReadiness> {
  const missing = deps.config ? [] : missingBrevoSendConfig();
  if (missing.length)
    return {
      problems: [`Lipsesc variabilele de mediu: ${missing.join(", ")}.`],
      recipients: null,
    };
  try {
    const { config, client } = await resolve(deps);
    const [senders, recipients] = await Promise.all([
      client.senders(),
      client.listRecipients(config.listId),
    ]);
    const problems: string[] = [];
    if (!senders.ok) problems.push(senders.error);
    else if (!senders.data?.some((s) => s.email === config.senderEmail && s.active))
      problems.push(
        `Expeditorul ${config.senderEmail} nu este adăugat sau activ în Brevo (Senders, Domains & Dedicated IPs).`,
      );
    if (!recipients.ok) problems.push(recipients.error);
    else if (recipients.data === 0)
      problems.push(`Lista Brevo #${config.listId} nu are abonați care pot primi campania.`);
    // A bad key or a blocked IP fails both calls with the same message: show it once.
    return { problems: [...new Set(problems)], recipients: recipients.ok ? recipients.data : null };
  } catch (error) {
    return {
      problems: [error instanceof CampaignError ? error.message : "Brevo nu a putut fi verificat."],
      recipients: null,
    };
  }
}

export type BrevoSendOutcome = { brevoCampaignId: number; recipients: number | null };

/**
 * Sends a DRAFT campaign with designed HTML to the Brevo list.
 *
 * Double sends are blocked twice over: the campaign is claimed (DRAFT →
 * SENDING) in one atomic update, and the Brevo campaign id is stored as soon
 * as Brevo creates it, so a retry reuses that campaign. Before a retry, Brevo
 * is asked for the campaign's status: if it already left the draft state (a
 * send whose answer was lost), the campaign is recorded as sent instead of
 * being sent again. Success only when Brevo answers sendNow with 204.
 */
export async function sendCampaignViaBrevo(
  campaignId: string,
  deps: Deps = {},
): Promise<BrevoSendOutcome> {
  const { config, client } = await resolve(deps);
  const campaign = await db.newsletterCampaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new CampaignError("Campania nu există.");
  if (campaign.status === "SENT") throw new CampaignError("Campania a fost deja trimisă.");
  if (!campaign.html)
    throw new CampaignError("Adaugă HTML-ul cu design înainte de a trimite prin Brevo.");

  const claimed = await db.newsletterCampaign.updateMany({
    where: {
      id: campaignId,
      OR: [
        { status: "DRAFT" },
        { status: "SENDING", updatedAt: { lt: new Date(Date.now() - STALE_SENDING_MS) } },
      ],
    },
    data: { status: "SENDING" },
  });
  if (claimed.count !== 1)
    throw new CampaignError("Campania a fost deja trimisă sau este în curs de trimitere.");

  const release = () =>
    db.newsletterCampaign.update({ where: { id: campaignId }, data: { status: "DRAFT" } });
  const markSent = (brevoCampaignId: number, sentAt: Date, recipients: number | null) =>
    db.newsletterCampaign.update({
      where: { id: campaignId },
      data: {
        status: "SENT",
        brevoCampaignId,
        sentAt,
        ...(recipients === null ? {} : { recipientCount: recipients }),
      },
    });

  const content: BrevoCampaignContent = {
    name: `${campaign.subject} · ${new Date().toISOString().slice(0, 10)}`,
    subject: campaign.subject,
    previewText: campaign.preheader,
    html: campaign.html,
    sender: { name: config.senderName, email: config.senderEmail },
    listId: config.listId,
  };

  try {
    let brevoId = campaign.brevoCampaignId;
    if (brevoId !== null) {
      const state = await client.get(brevoId);
      if (!state.ok) throw new CampaignError(state.error);
      if (TAKEN_OVER.has(state.data.status)) {
        const recipients = state.data.stats?.sent || null;
        await markSent(brevoId, state.data.sentDate ?? new Date(), recipients);
        return { brevoCampaignId: brevoId, recipients };
      }
      if (state.data.status !== "draft")
        throw new CampaignError(
          `Campania #${brevoId} are în Brevo starea „${state.data.status}”. Verific-o în Brevo înainte de a încerca din nou.`,
        );
      const updated = await client.update(brevoId, content);
      if (!updated.ok) throw new CampaignError(updated.error);
    } else {
      const created = await client.create(content);
      if (!created.ok) throw new CampaignError(created.error);
      brevoId = created.data;
      await db.newsletterCampaign.update({
        where: { id: campaignId },
        data: { brevoCampaignId: brevoId },
      });
    }

    const recipients = await client.listRecipients(config.listId);
    const sent = await client.sendNow(brevoId);
    if (!sent.ok) throw new CampaignError(sent.error);
    const count = recipients.ok ? recipients.data : null;
    await markSent(brevoId, new Date(), count);
    return { brevoCampaignId: brevoId, recipients: count };
  } catch (error) {
    await release();
    throw error;
  }
}

/** Brevo took the campaign over (queued, sending, in review or sent): it must not be sent again. */
const TAKEN_OVER = new Set(["sent", "queued", "in_process", "in_review"]);

/** Statistics of a campaign sent through Brevo, or an error message. Never throws. */
export async function brevoCampaignReport(brevoCampaignId: number, deps: Deps = {}) {
  try {
    const { client } = await resolve(deps);
    return await client.get(brevoCampaignId);
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof CampaignError ? error.message : "Statisticile Brevo nu sunt disponibile.",
    };
  }
}
