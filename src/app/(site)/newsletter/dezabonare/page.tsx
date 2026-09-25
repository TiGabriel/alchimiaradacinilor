import type { Metadata } from "next";

import { ConfirmUnsubscribe } from "@/features/newsletter/confirm-panel";

export const metadata: Metadata = {
  title: "Dezabonare",
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ s?: string | string[]; t?: string | string[] }>;
}) {
  const { s, t } = await searchParams;
  return (
    <div className="container-page flex max-w-xl flex-col gap-6 py-16 md:py-24">
      <h1 className="text-center text-display-lg">Dezabonare</h1>
      <ConfirmUnsubscribe
        subscriberId={typeof s === "string" ? s : ""}
        signature={typeof t === "string" ? t : ""}
      />
    </div>
  );
}
