import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BrevoSendPanel } from "@/features/admin/marketing/brevo-send-panel";
import { CampaignForm } from "@/features/admin/marketing/campaign-form";
import { campaignOptions } from "@/features/admin/marketing/campaign-options";
import { AdminCard, AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { emailConfigured } from "@/lib/email";
import { previewBrevoHtml } from "@/lib/email/brevo-html";
import {
  adminBrevoCampaignReport,
  adminBrevoReadiness,
  getCampaign,
} from "@/services/admin/newsletter";
import { marketingProvider } from "@/services/newsletter/marketing-sync";

export const metadata: Metadata = { title: "Campanie" };

const date = new Intl.DateTimeFormat("ro-RO", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Bucharest",
});

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const { user } = await requirePermission("users:manage");
  const actor = { id: user.id, roles: user.roles };
  const [campaign, options] = await Promise.all([getCampaign(actor, id), campaignOptions()]);
  if (!campaign) notFound();

  const sentViaBrevo = campaign.status === "SENT" && campaign.brevoCampaignId !== null;
  const showBrevo = sentViaBrevo || (campaign.status !== "SENT" && marketingProvider() !== null);
  const [readiness, report] = await Promise.all([
    showBrevo && !sentViaBrevo ? adminBrevoReadiness(actor) : null,
    sentViaBrevo ? adminBrevoCampaignReport(actor, campaign.brevoCampaignId!) : null,
  ]);

  return (
    <>
      <AdminPageHeader
        title={campaign.subject}
        description={
          sentViaBrevo
            ? `Trimisă prin Brevo pe ${date.format(campaign.sentAt!)} · ID campanie Brevo: ${campaign.brevoCampaignId}`
            : campaign.sentAt
              ? `Trimisă pe ${date.format(campaign.sentAt)} · ${campaign.deliveredCount} livrate, ${campaign.failedCount} eșuate din ${campaign.recipientCount}`
              : campaign.status === "SENDING"
                ? "Se trimite…"
                : `Ciornă · audiență curentă: ${campaign.audience}`
        }
        back={{ href: "/admin/newsletter", label: "Newsletter" }}
      />
      {showBrevo ? (
        <BrevoSendPanel
          campaignId={campaign.id}
          hasHtml={Boolean(campaign.html)}
          sent={
            sentViaBrevo
              ? { at: date.format(campaign.sentAt!), brevoCampaignId: campaign.brevoCampaignId }
              : null
          }
          problems={readiness?.problems ?? []}
          recipients={readiness?.recipients ?? null}
          stats={report?.ok ? report.data.stats : null}
          statsError={report && !report.ok ? report.error : null}
        />
      ) : null}
      {campaign.html ? (
        <AdminCard title="Previzualizare">
          <p className="-mt-2 text-sm text-ink-muted">
            Așa arată emailul pentru un abonat cu prenumele „Ana”. Linkurile Brevo (dezabonare,
            versiunea online) funcționează doar în emailul trimis.
          </p>
          <iframe
            title={`Previzualizare: ${campaign.subject}`}
            srcDoc={previewBrevoHtml(campaign.html, { firstName: "Ana" })}
            sandbox=""
            loading="lazy"
            className="h-[80vh] min-h-[32rem] w-full rounded-lg border border-line bg-white"
          />
        </AdminCard>
      ) : null}
      <CampaignForm
        campaignId={campaign.id}
        editable={campaign.status === "DRAFT"}
        emailEnabled={emailConfigured()}
        initial={{
          subject: campaign.subject,
          preheader: campaign.preheader ?? "",
          heading: campaign.heading,
          body: campaign.body,
          html: campaign.html ?? "",
          segment: campaign.segment,
        }}
        {...options}
      />
    </>
  );
}
