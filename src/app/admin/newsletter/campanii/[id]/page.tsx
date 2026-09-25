import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CampaignForm } from "@/features/admin/marketing/campaign-form";
import { campaignOptions } from "@/features/admin/marketing/campaign-options";
import { AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { emailConfigured } from "@/lib/email";
import { getCampaign } from "@/services/admin/newsletter";

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
  const [campaign, options] = await Promise.all([
    getCampaign({ id: user.id, roles: user.roles }, id),
    campaignOptions(),
  ]);
  if (!campaign) notFound();
  return (
    <>
      <AdminPageHeader
        title={campaign.subject}
        description={
          campaign.sentAt
            ? `Trimisă pe ${date.format(campaign.sentAt)} · ${campaign.deliveredCount} livrate, ${campaign.failedCount} eșuate din ${campaign.recipientCount}`
            : `Ciornă · audiență curentă: ${campaign.audience}`
        }
        back={{ href: "/admin/newsletter", label: "Newsletter" }}
      />
      <CampaignForm
        campaignId={campaign.id}
        editable={campaign.status === "DRAFT"}
        emailEnabled={emailConfigured()}
        initial={{
          subject: campaign.subject,
          preheader: campaign.preheader ?? "",
          heading: campaign.heading,
          body: campaign.body,
          segment: campaign.segment,
        }}
        {...options}
      />
    </>
  );
}
