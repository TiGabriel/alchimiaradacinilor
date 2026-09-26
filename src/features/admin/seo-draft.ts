/** SEO form state shared by the admin editors (pure; used by server pages and client forms). */
export type SeoDraft = {
  seoTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  noIndex: boolean;
  ogImage: { id: string; url: string } | null;
};

export const EMPTY_SEO: SeoDraft = {
  seoTitle: "",
  metaDescription: "",
  canonicalUrl: "",
  noIndex: false,
  ogImage: null,
};

type StoredSeo = {
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  noIndex: boolean;
  ogImageId: string | null;
  ogImage: { url: string } | null;
} | null;

export function seoDraftFrom(seo: StoredSeo | undefined): SeoDraft {
  if (!seo) return EMPTY_SEO;
  return {
    seoTitle: seo.seoTitle ?? "",
    metaDescription: seo.metaDescription ?? "",
    canonicalUrl: seo.canonicalUrl ?? "",
    noIndex: seo.noIndex,
    ogImage: seo.ogImageId && seo.ogImage ? { id: seo.ogImageId, url: seo.ogImage.url } : null,
  };
}

/** The shape the SEO schema parses. */
export function seoPayload(d: SeoDraft) {
  return {
    seoTitle: d.seoTitle,
    metaDescription: d.metaDescription,
    canonicalUrl: d.canonicalUrl,
    noIndex: d.noIndex,
    ogImageId: d.ogImage?.id ?? "",
  };
}
