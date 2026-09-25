import "server-only";

import { db } from "@/lib/db";
import { productHref } from "@/services/catalog/product-types";
import { productTypeLabels } from "@/validation/product";

import type { SearchSource } from "./types";

export const productSource: SearchSource = {
  type: "product",
  label: "Produse",
  async load() {
    const products = await db.product.findMany({
      where: { active: true },
      select: {
        id: true,
        slug: true,
        name: true,
        sku: true,
        shortDescription: true,
        productType: true,
        price: true,
        compareAtPrice: true,
        stock: true,
        brand: { select: { name: true } },
        category: { select: { name: true, parent: { select: { name: true } } } },
        tags: { select: { tag: { select: { name: true } } } },
        needs: { select: { need: { select: { name: true } } } },
        aromaProfiles: {
          orderBy: { intensity: "desc" },
          select: { aromaProfile: { select: { name: true, colorHex: true } } },
        },
        images: {
          orderBy: { position: "asc" },
          take: 1,
          select: { media: { select: { url: true } } },
        },
      },
    });
    return products.map((p) => ({
      id: p.id,
      type: "product",
      title: p.name,
      subtitle: p.shortDescription,
      href: productHref(p),
      keywords: [
        p.sku,
        productTypeLabels[p.productType],
        p.category.name,
        p.category.parent?.name ?? "",
        p.brand?.name ?? "",
        ...p.tags.map((t) => t.tag.name),
        ...p.needs.map((n) => n.need.name),
        ...p.aromaProfiles.map((a) => a.aromaProfile.name),
      ].filter(Boolean),
      // In-stock products rank slightly higher.
      boost: p.stock > 0 ? 1 : 0.85,
      meta: {
        price: p.price,
        compareAtPrice: p.compareAtPrice,
        productType: p.productType,
        image: p.images[0]?.media.url ?? null,
        tone: p.aromaProfiles[0]?.aromaProfile.colorHex ?? null,
      },
    }));
  },
};
