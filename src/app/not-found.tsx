import type { Metadata } from "next";
import { connection } from "next/server";

import { SiteChrome } from "@/components/layout/site-chrome";
import { NotFoundContent } from "@/components/states/not-found-content";

export const metadata: Metadata = { title: "Pagina nu a fost găsită", robots: { index: false } };

/** Unmatched URLs (rendered in the root layout, so the chrome is added here). */
export default async function RootNotFound() {
  // Render per request so the navigation reflects current categories.
  await connection();
  return (
    <SiteChrome>
      <NotFoundContent />
    </SiteChrome>
  );
}
