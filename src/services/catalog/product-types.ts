/** Shapes shared by server queries and client components (pure, no I/O). */
import type { ProductType } from "@/generated/prisma/enums";

export type ProductImageData = { url: string; alt: string | null };

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  brandName: string | null;
  productType: ProductType;
  /** Price on the doTERRA site, minor units (bani). */
  price: number;
  /** A referral link is set: show "Cumpără de pe doTERRA" (the link itself stays on the server). */
  hasDoterraLink: boolean;
  rating: number | null;
  reviewCount: number;
  isDemo: boolean;
  isNew: boolean;
  /** Up to two images: the second one is revealed on hover. */
  images: ProductImageData[];
  /** Placeholder tint: colour of the strongest aroma profile. */
  tone: string | null;
};

export function productHref(product: { slug: string }) {
  return `/produs/${product.slug}`;
}

/**
 * Products that can be bought through a doTERRA link come first in every list (owner decision,
 * D-092); otherwise the order given is kept.
 */
export function linkedFirst<T>(items: readonly T[], hasLink: (item: T) => boolean): T[] {
  return [...items.filter(hasLink), ...items.filter((item) => !hasLink(item))];
}
