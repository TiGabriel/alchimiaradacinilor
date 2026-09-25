import type { ProductFormState } from "./product-form";

type LoadedProduct = {
  name: string;
  slug: string;
  sku: string;
  brandId: string | null;
  categoryId: string;
  productType: ProductFormState["productType"];
  shortDescription: string;
  description: string;
  usageInfo: string | null;
  safetyInfo: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  featured: boolean;
  active: boolean;
  attributes: unknown;
  seo: { seoTitle: string | null; metaDescription: string | null; noIndex: boolean } | null;
  needs: Array<{ needId: string; relevance: number }>;
  aromaProfiles: Array<{ aromaProfileId: string; intensity: number }>;
  tags: Array<{ tagId: string }>;
  collections: Array<{ collectionId: string }>;
};

/** Bani → "59,90" for editing. */
const lei = (v: number | null) => (v == null ? "" : (v / 100).toFixed(2).replace(".", ","));

export function emptyProductForm(): ProductFormState {
  return {
    name: "",
    slug: "",
    sku: "",
    brandId: "",
    categoryId: "",
    productType: "INDIVIDUAL_OIL",
    shortDescription: "",
    description: "",
    usageInfo: "",
    safetyInfo: "",
    price: "",
    compareAtPrice: "",
    stock: "0",
    featured: false,
    active: true,
    needs: [],
    aromas: [],
    tagIds: [],
    collectionIds: [],
    attributes: {},
    seo: { seoTitle: "", metaDescription: "", noIndex: false },
  };
}

export function productToForm(p: LoadedProduct): ProductFormState {
  const attrs = (p.attributes && typeof p.attributes === "object" ? p.attributes : {}) as Record<
    string,
    unknown
  >;
  return {
    name: p.name,
    slug: p.slug,
    sku: p.sku,
    brandId: p.brandId ?? "",
    categoryId: p.categoryId,
    productType: p.productType,
    shortDescription: p.shortDescription,
    description: p.description,
    usageInfo: p.usageInfo ?? "",
    safetyInfo: p.safetyInfo ?? "",
    price: lei(p.price),
    compareAtPrice: lei(p.compareAtPrice),
    stock: String(p.stock),
    featured: p.featured,
    active: p.active,
    needs: p.needs.map((n) => ({ id: n.needId, relevance: n.relevance })),
    aromas: p.aromaProfiles.map((a) => ({ id: a.aromaProfileId, intensity: a.intensity })),
    tagIds: p.tags.map((t) => t.tagId),
    collectionIds: p.collections.map((c) => c.collectionId),
    attributes: Object.fromEntries(Object.entries(attrs).map(([k, v]) => [k, String(v)])),
    seo: {
      seoTitle: p.seo?.seoTitle ?? "",
      metaDescription: p.seo?.metaDescription ?? "",
      noIndex: p.seo?.noIndex ?? false,
    },
  };
}
