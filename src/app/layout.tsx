import type { Metadata, Viewport } from "next";

import { Providers } from "@/components/layout/providers";
import { paletteCss, PRODUCT_PHOTO_FILTER_ID, productPhotoMatrix } from "@/lib/palette";
import { cn } from "@/lib/utils";
import { DEFAULT_OG_IMAGE, siteUrl } from "@/lib/seo";
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
      images: [{ url: seo.ogImageUrl ?? DEFAULT_OG_IMAGE }],
    },
    twitter: { card: "summary_large_image", images: [seo.ogImageUrl ?? DEFAULT_OG_IMAGE] },
    formatDetection: { telephone: false },
  };
}

export async function generateViewport(): Promise<Viewport> {
  const { theme } = await getSettings();
  return {
    themeColor: theme.colors.paper,
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Colours chosen in Setări › Culori site override the globals.css tokens (src/lib/palette.ts).
  const { theme } = await getSettings();
  const themeCss = paletteCss(theme.colors);
  const photoMatrix = productPhotoMatrix(theme.colors.productBackdrop);
  return (
    <html lang="ro" className={cn(fontDisplay.variable, fontSans.variable)}>
      {themeCss ? (
        <head>
          {/* Validated #rrggbb values only (validation/settings.ts), so nothing to escape. */}
          <style id="culori-site" dangerouslySetInnerHTML={{ __html: themeCss }} />
        </head>
      ) : null}
      <body>
        {photoMatrix ? (
          // The `.product-photo` filter. Not display:none, which would disable it in some browsers.
          <svg aria-hidden width="0" height="0" className="absolute">
            <filter id={PRODUCT_PHOTO_FILTER_ID} colorInterpolationFilters="sRGB">
              <feColorMatrix type="matrix" values={photoMatrix} />
            </filter>
          </svg>
        ) : null}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
