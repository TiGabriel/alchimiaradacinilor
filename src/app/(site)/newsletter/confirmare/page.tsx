import type { Metadata } from "next";

import { ConfirmSubscription } from "@/features/newsletter/confirm-panel";

export const metadata: Metadata = {
  title: "Confirmă abonarea",
  robots: { index: false, follow: false },
};

export default async function ConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;
  return (
    <div className="container-page flex max-w-xl flex-col gap-6 py-16 md:py-24">
      <h1 className="text-center text-display-lg">Newsletter</h1>
      <ConfirmSubscription token={typeof token === "string" ? token : ""} />
    </div>
  );
}
