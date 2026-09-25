import type { Metadata } from "next";

import { ProfileForm } from "@/features/account/profile-forms";
import { AccountHeader } from "@/features/account/section";
import { requireUser } from "@/features/auth/session";
import { getProfile } from "@/services/account/profile";

export const metadata: Metadata = {
  title: "Date personale",
  robots: { index: false, follow: false },
};

export default async function PersonalDataPage() {
  const { user } = await requireUser("/cont/date-personale");
  const profile = await getProfile(user.id);
  return (
    <div className="flex flex-col gap-6">
      <AccountHeader
        title="Date personale"
        description="Numele și datele de contact asociate contului tău."
      />
      <div className="rounded-xl border border-line bg-surface p-6">
        <ProfileForm profile={profile} />
      </div>
    </div>
  );
}
