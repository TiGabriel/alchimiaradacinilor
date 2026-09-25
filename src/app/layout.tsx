import type { Metadata, Viewport } from "next";

import { Providers } from "@/components/layout/providers";
import { cn } from "@/lib/utils";
import { SITE_NAME, siteUrl } from "@/lib/seo";

import { fontDisplay, fontSans } from "./fonts";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE_NAME} — Uleiuri esențiale și ritualuri botanice`,
    template: `%s · ${SITE_NAME}`,
  },
  description:
    "Uleiuri esențiale, amestecuri, kit-uri și difuzoare, alese cu grijă pentru ritualurile tale de zi cu zi.",
  applicationName: SITE_NAME,
  openGraph: { type: "website", locale: "ro_RO", siteName: SITE_NAME },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#f8f4ec",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ro" className={cn(fontDisplay.variable, fontSans.variable)}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
