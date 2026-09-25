import type { Metadata } from "next";

import { CampaignForm } from "@/features/admin/marketing/campaign-form";
import { campaignOptions } from "@/features/admin/marketing/campaign-options";
import { AdminPageHeader } from "@/features/admin/ui";
import { requirePermission } from "@/features/auth/session";
import { emailConfigured } from "@/lib/email";

export const metadata: Metadata = { title: "Campanie nouă" };

export default async function NewCampaignPage() {
  await requirePermission("users:manage");
  const options = await campaignOptions();
  return (
    <>
      <AdminPageHeader
        title="Campanie nouă"
        back={{ href: "/admin/newsletter", label: "Newsletter" }}
      />
      <CampaignForm
        initial={{ subject: "", preheader: "", heading: "", body: "", segment: {} }}
        editable
        emailEnabled={emailConfigured()}
        {...options}
      />
    </>
  );
}
