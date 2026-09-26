import "server-only";

import type { Metadata } from "next";

import { db } from "@/lib/db";
import { absoluteUrl, buildMetadata, siteUrl, type PageSeo } from "@/lib/seo";

import { getSettings } from "./settings";

/** Metadata for a public page with the site's SEO defaults (description, social image). */
export async function pageMetadata(page: PageSeo): Promise<Metadata> {
  const { seo, brand } = await getSettings();
  return buildMetadata(page, {
    siteName: brand.siteName,
    description: seo.defaultDescription,
    image: seo.ogImageUrl,
  });
}

/** Organization + WebSite structured data for the homepage. */
export async function organizationJsonLd() {
  const { brand, contact, social } = await getSettings();
  const logo = brand.logo.kind === "image" ? absoluteUrl(brand.logo.src) : siteUrl("/icon.svg");
  const sameAs = [social.facebookUrl, social.instagramUrl].filter((u): u is string => Boolean(u));
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": siteUrl("/#organizatie"),
      name: brand.siteName,
      url: siteUrl(),
      logo,
      email: contact.email,
      ...(contact.phone ? { telephone: contact.phone } : {}),
      ...(sameAs.length ? { sameAs } : {}),
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer service",
        email: contact.email,
        ...(contact.phone ? { telephone: contact.phone } : {}),
        availableLanguage: ["ro"],
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": siteUrl("/#site"),
      name: brand.siteName,
      url: siteUrl(),
      inLanguage: "ro-RO",
      publisher: { "@id": siteUrl("/#organizatie") },
    },
  ];
}

/** Rows that can be indexed: no SEO record, or one without `noIndex` and without a foreign canonical. */
const indexable = { OR: [{ seoId: null }, { seo: { noIndex: false, canonicalUrl: null } }] };

/** Indexable content for the sitemap (inactive, draft and `noIndex` pages are left out). */
export async function getSitemapContent() {
  const [products, routines, articles, hiddenCategories] = await Promise.all([
    db.product.findMany({
      where: { active: true, ...indexable },
      select: { slug: true, productType: true, updatedAt: true },
    }),
    db.routine.findMany({
      where: { active: true, ...indexable },
      select: { slug: true, updatedAt: true },
    }),
    db.article.findMany({
      where: { status: "PUBLISHED", publishedAt: { lte: new Date() }, ...indexable },
      select: { slug: true, updatedAt: true },
    }),
    db.category.findMany({
      where: { seo: { OR: [{ noIndex: true }, { canonicalUrl: { not: null } }] } },
      select: { id: true },
    }),
  ]);
  return {
    products,
    routines,
    articles,
    hiddenCategoryIds: new Set(hiddenCategories.map((c) => c.id)),
  };
}
