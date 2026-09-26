import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { ProductType } from "@/generated/prisma/enums";
import { db } from "@/lib/db";
import { storage, storeImage } from "@/lib/storage";
import {
  imageAltSchema,
  PRODUCT_IMAGE_MAX_BYTES,
  productFormSchema,
} from "@/validation/admin/product";

import { assertCan, type Actor } from "../auth/permissions";

import { AdminError } from "./errors";
import { upsertSeo } from "./seo";

export const PAGE_SIZE = 25;
export const LOW_STOCK = 5;

export type ProductListFilter = {
  q?: string;
  status?: "active" | "inactive" | "low-stock" | "out-of-stock";
  categoryId?: string;
  type?: ProductType;
  page?: number;
};

export async function listAdminProducts(actor: Actor, filter: ProductListFilter) {
  assertCan(actor, "catalog:edit");
  const where: Prisma.ProductWhereInput = {
    ...(filter.q
      ? {
          OR: [
            { name: { contains: filter.q, mode: "insensitive" } },
            { sku: { contains: filter.q, mode: "insensitive" } },
            { slug: { contains: filter.q, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(filter.status === "active" ? { active: true } : {}),
    ...(filter.status === "inactive" ? { active: false } : {}),
    ...(filter.status === "low-stock" ? { stock: { gt: 0, lte: LOW_STOCK } } : {}),
    ...(filter.status === "out-of-stock" ? { stock: { lte: 0 } } : {}),
    ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
    ...(filter.type ? { productType: filter.type } : {}),
  };
  const page = Math.max(1, filter.page ?? 1);
  const [total, products] = await Promise.all([
    db.product.count({ where }),
    db.product.findMany({
      where,
      orderBy: [{ updatedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        price: true,
        compareAtPrice: true,
        stock: true,
        active: true,
        featured: true,
        isDemo: true,
        productType: true,
        category: { select: { name: true } },
        images: {
          orderBy: { position: "asc" },
          take: 1,
          select: { media: { select: { url: true } } },
        },
      },
    }),
  ]);
  return { total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)), products };
}

export async function getAdminProduct(actor: Actor, id: string) {
  assertCan(actor, "catalog:edit");
  return db.product.findUnique({
    where: { id },
    include: {
      seo: { include: { ogImage: { select: { url: true } } } },
      needs: { select: { needId: true, relevance: true } },
      aromaProfiles: { select: { aromaProfileId: true, intensity: true } },
      tags: { select: { tagId: true } },
      collections: { select: { collectionId: true } },
      images: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          position: true,
          alt: true,
          media: { select: { url: true, width: true, height: true } },
        },
      },
      _count: { select: { orderItems: true, partOfKits: true } },
    },
  });
}

/** Options for the product form's selects. */
export async function getProductFormOptions(actor: Actor) {
  assertCan(actor, "catalog:edit");
  const [categories, brands, needs, aromas, tags, collections] = await Promise.all([
    db.category.findMany({
      orderBy: [{ parentId: { sort: "asc", nulls: "first" } }, { position: "asc" }],
      select: { id: true, name: true, parentId: true },
    }),
    db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.need.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
    db.aromaProfile.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
    db.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.collection.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
  ]);
  return { categories, brands, needs, aromas, tags, collections };
}

async function assertUnique(slug: string, sku: string, exceptId?: string) {
  const clash = await db.product.findFirst({
    where: { OR: [{ slug }, { sku }], ...(exceptId ? { NOT: { id: exceptId } } : {}) },
    select: { slug: true, sku: true },
  });
  if (!clash) return;
  const fieldErrors: Record<string, string> = {};
  if (clash.slug === slug) fieldErrors.slug = "Există deja un produs cu acest slug.";
  if (clash.sku === sku) fieldErrors.sku = "Există deja un produs cu acest SKU.";
  throw new AdminError("Slug-ul sau SKU-ul este deja folosit.", fieldErrors);
}

/** Creates or updates a product with all its relations in one transaction. */
export async function saveProduct(actor: Actor, raw: unknown, id?: string) {
  assertCan(actor, "catalog:edit");
  const input = productFormSchema.parse(raw);
  await assertUnique(input.slug, input.sku, id);

  return db.$transaction(async (tx) => {
    const existing = id
      ? await tx.product.findUnique({ where: { id }, select: { id: true, seoId: true } })
      : null;
    if (id && !existing) throw new AdminError("Produsul nu mai există.");

    const seoId = await upsertSeo(tx, existing?.seoId ?? null, input.seo);

    const data = {
      name: input.name,
      slug: input.slug,
      sku: input.sku,
      brandId: input.brandId,
      categoryId: input.categoryId,
      productType: input.productType,
      shortDescription: input.shortDescription,
      description: input.description,
      usageInfo: input.usageInfo ?? null,
      safetyInfo: input.safetyInfo ?? null,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      stock: input.stock,
      featured: input.featured,
      active: input.active,
      attributes: input.attributes as Prisma.InputJsonValue,
      seoId,
    };
    const product = existing
      ? await tx.product.update({ where: { id: existing.id }, data })
      : await tx.product.create({ data });

    // Relations are replaced as a whole — simple and predictable.
    await tx.productNeed.deleteMany({ where: { productId: product.id } });
    await tx.productAromaProfile.deleteMany({ where: { productId: product.id } });
    await tx.productTag.deleteMany({ where: { productId: product.id } });
    await tx.collectionProduct.deleteMany({ where: { productId: product.id } });
    if (input.needs.length)
      await tx.productNeed.createMany({
        data: input.needs.map((n) => ({
          productId: product.id,
          needId: n.id,
          relevance: n.relevance,
        })),
      });
    if (input.aromas.length)
      await tx.productAromaProfile.createMany({
        data: input.aromas.map((a) => ({
          productId: product.id,
          aromaProfileId: a.id,
          intensity: a.intensity,
        })),
      });
    if (input.tagIds.length)
      await tx.productTag.createMany({
        data: input.tagIds.map((tagId) => ({ productId: product.id, tagId })),
      });
    if (input.collectionIds.length)
      await tx.collectionProduct.createMany({
        data: input.collectionIds.map((collectionId) => ({ productId: product.id, collectionId })),
      });
    return { id: product.id, slug: product.slug };
  });
}

/**
 * Deletes a product that was never ordered and is not part of a kit.
 * Otherwise deactivate it: orders keep their snapshots either way.
 */
export async function deleteProduct(actor: Actor, id: string) {
  assertCan(actor, "catalog:edit");
  const product = await db.product.findUnique({
    where: { id },
    select: {
      _count: { select: { orderItems: true, partOfKits: true } },
      images: { select: { id: true } },
    },
  });
  if (!product) return;
  if (product._count.partOfKits > 0)
    throw new AdminError("Produsul face parte dintr-un kit. Scoate-l din kit sau dezactivează-l.");
  if (product._count.orderItems > 0)
    throw new AdminError(
      "Produsul apare în comenzi, așa că nu poate fi șters. Dezactivează-l — va dispărea din magazin.",
    );
  for (const image of product.images) await removeProductImage(actor, id, image.id);
  await db.product.delete({ where: { id } });
}

// ── Images ──────────────────────────────────────────────────────────────────

export async function addProductImage(actor: Actor, productId: string, file: Blob, alt: string) {
  assertCan(actor, "catalog:edit");
  const cleanAlt = imageAltSchema.parse(alt);
  const product = await db.product.findUnique({
    where: { id: productId },
    select: { name: true, _count: { select: { images: true } } },
  });
  if (!product) throw new AdminError("Produsul nu mai există.");
  if (product._count.images >= 12)
    throw new AdminError("Un produs poate avea cel mult 12 imagini.");

  const stored = await storeImage(file, {
    folder: "products",
    maxBytes: PRODUCT_IMAGE_MAX_BYTES,
    maxDimension: 2400,
  });
  try {
    return await db.$transaction(async (tx) => {
      const media = await tx.mediaAsset.create({
        data: {
          storageKey: stored.key,
          url: stored.url,
          mimeType: stored.mimeType,
          width: stored.width,
          height: stored.height,
          sizeBytes: stored.sizeBytes,
          alt: cleanAlt || product.name,
          createdById: actor.id,
        },
      });
      const last = await tx.productImage.findFirst({
        where: { productId },
        orderBy: { position: "desc" },
        select: { position: true },
      });
      return tx.productImage.create({
        data: {
          productId,
          mediaId: media.id,
          position: (last?.position ?? -1) + 1,
          alt: cleanAlt || null,
        },
        select: { id: true },
      });
    });
  } catch (error) {
    await storage()
      .delete(stored.key)
      .catch(() => {});
    throw error;
  }
}

/**
 * Applies a new image order. Position 0 is the thumbnail, so "set as
 * thumbnail" is a reorder that moves the image to the front.
 */
export async function reorderProductImages(actor: Actor, productId: string, orderedIds: string[]) {
  assertCan(actor, "catalog:edit");
  await db.$transaction(async (tx) => {
    const images = await tx.productImage.findMany({ where: { productId }, select: { id: true } });
    const known = new Set(images.map((i) => i.id));
    if (orderedIds.length !== images.length || !orderedIds.every((id) => known.has(id)))
      throw new AdminError("Lista de imagini s-a schimbat. Reîncarcă pagina.");
    // Two passes avoid clashing with the (productId, position) unique index.
    for (const [index, id] of orderedIds.entries())
      await tx.productImage.update({ where: { id }, data: { position: 1000 + index } });
    for (const [index, id] of orderedIds.entries())
      await tx.productImage.update({ where: { id }, data: { position: index } });
  });
}

export async function setProductThumbnail(actor: Actor, productId: string, imageId: string) {
  const images = await db.productImage.findMany({
    where: { productId },
    orderBy: { position: "asc" },
    select: { id: true },
  });
  const ids = images.map((i) => i.id);
  if (!ids.includes(imageId)) throw new AdminError("Imaginea nu aparține produsului.");
  await reorderProductImages(actor, productId, [imageId, ...ids.filter((id) => id !== imageId)]);
}

export async function updateProductImageAlt(
  actor: Actor,
  productId: string,
  imageId: string,
  alt: string,
) {
  assertCan(actor, "catalog:edit");
  await db.productImage.updateMany({
    where: { id: imageId, productId },
    data: { alt: imageAltSchema.parse(alt) || null },
  });
}

/** Removes the image; the file is deleted too when nothing else uses it. */
export async function removeProductImage(actor: Actor, productId: string, imageId: string) {
  assertCan(actor, "catalog:edit");
  const image = await db.productImage.findFirst({
    where: { id: imageId, productId },
    select: { mediaId: true },
  });
  if (!image) return;
  await db.productImage.delete({ where: { id: imageId } });
  const remaining = await db.productImage.findMany({
    where: { productId },
    orderBy: { position: "asc" },
    select: { id: true },
  });
  if (remaining.length)
    await reorderProductImages(
      actor,
      productId,
      remaining.map((r) => r.id),
    );

  const media = await db.mediaAsset.findUnique({
    where: { id: image.mediaId },
    select: {
      storageKey: true,
      _count: {
        select: {
          productImages: true,
          categoryImages: true,
          brandLogos: true,
          collectionImgs: true,
          routineImages: true,
          articleCovers: true,
          seoOgImages: true,
          needIcons: true,
          reviewImages: true,
        },
      },
    },
  });
  if (media && Object.values(media._count).every((n) => n === 0)) {
    await db.mediaAsset.delete({ where: { id: image.mediaId } });
    await storage()
      .delete(media.storageKey)
      .catch(() => {});
  }
}
