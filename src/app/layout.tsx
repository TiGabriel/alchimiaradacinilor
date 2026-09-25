import type { Metadata, Viewport } from "next";

import { Providers } from "@/components/layout/providers";
import { cn } from "@/lib/utils";
import { siteUrl } from "@/lib/seo";
import { getSettings } from "@/services/settings";

import { fontDisplay, fontSans } from "./fonts";

import "./globals.css";

/** Site-wide defaults come from the `seo` and `brand` settings (editable in the admin). */
export async function generateMetadata(): Promise<Metadata> {
  const { seo, brand } = await getSettings();
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: seo.defaultTitle, template: seo.titleTemplate },
    description: seo.defaultDescription,
    applicationName: brand.siteName,
    openGraph: {
      type: "website",
      locale: "ro_RO",
      siteName: brand.siteName,
      ...(seo.ogImageUrl ? { images: [{ url: seo.ogImageUrl }] } : {}),
    },
    formatDetection: { telephone: false },
  };
}

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
