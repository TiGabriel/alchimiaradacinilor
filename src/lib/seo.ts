import type { Metadata } from "next";

/** Base URL for canonical/OG links. Safe on server and client (NEXT_PUBLIC fallback). */
export function siteUrl(path = "/"): string {
  const base = (
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export const SITE_NAME = "Alchimia Rădăcinilor";

/** Social preview used when neither the page nor the settings provide one (1200×630). */
export const DEFAULT_OG_IMAGE = "/og-default.png";

/** Absolute URL for a stored path or a full URL (JSON-LD needs absolute URLs). */
export function absoluteUrl(pathOrUrl: string): string {
  return /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : siteUrl(pathOrUrl);
}

export type PageSeo = {
  /** Page title (the layout template adds the site name). */
  title: string;
  description?: string | null;
  /** Site path of the page, e.g. `/rutine/seara`. */
  path: string;
  /** Editor-provided canonical (path or absolute URL); defaults to `path`. */
  canonical?: string | null;
  image?: string | null;
  imageAlt?: string | null;
  type?: "website" | "article";
  noIndex?: boolean;
  publishedTime?: Date | null;
  modifiedTime?: Date | null;
  authors?: string[];
};

export type SeoDefaults = {
  siteName: string;
  description: string;
  /** Settings-level social image; falls back to {@link DEFAULT_OG_IMAGE}. */
  image: string | null;
};

/** Keeps descriptions within what search results show, cutting at a word boundary. */
export function clampDescription(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > max * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.;:–—-]+$/, "")}…`;
}

/**
 * Complete metadata for a public page: canonical, robots, Open Graph and Twitter.
 * Next.js replaces (not merges) the parent's `openGraph`, so every field is set here.
 */
export function buildMetadata(page: PageSeo, defaults: SeoDefaults): Metadata {
  const description = clampDescription(page.description?.trim() || defaults.description);
  const image = page.image || defaults.image || DEFAULT_OG_IMAGE;
  const images = [{ url: image, alt: page.imageAlt || page.title }];
  return {
    title: page.title,
    description,
    alternates: { canonical: page.canonical || page.path },
    robots: page.noIndex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: page.type ?? "website",
      locale: "ro_RO",
      siteName: defaults.siteName,
      url: page.path,
      title: page.title,
      description,
      images,
      ...(page.type === "article"
        ? {
            publishedTime: page.publishedTime?.toISOString(),
            modifiedTime: page.modifiedTime?.toISOString(),
            authors: page.authors,
          }
        : {}),
    },
    twitter: { card: "summary_large_image", title: page.title, description, images },
  };
}
