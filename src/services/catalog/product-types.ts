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
  /** Minor units (bani). */
  price: number;
  compareAtPrice: number | null;
  rating: number | null;
  reviewCount: number;
  stock: number;
  isDemo: boolean;
  isNew: boolean;
  /** Up to two images: the second one is revealed on hover. */
  images: ProductImageData[];
  /** Placeholder tint: colour of the strongest aroma profile. */
  tone: string | null;
};

export const LOW_STOCK_THRESHOLD = 3;

export type StockStatus = "in-stock" | "low-stock" | "out-of-stock";

export function stockStatus(stock: number): StockStatus {
  if (stock <= 0) return "out-of-stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "low-stock";
  return "in-stock";
}

export function stockLabel(stock: number): string {
  const status = stockStatus(stock);
  if (status === "out-of-stock") return "Stoc epuizat";
  if (status === "low-stock")
    return stock === 1 ? "Ultimul produs în stoc" : `Doar ${stock} în stoc`;
  return "În stoc";
}

export function productHref(product: { slug: string }) {
  return `/produs/${product.slug}`;
}
