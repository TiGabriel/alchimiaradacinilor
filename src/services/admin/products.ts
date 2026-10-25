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

import { testReferralLink, type LinkCheckResult } from "../affiliate/check";
import { isAllowedReferralUrl } from "../affiliate/links";
import { assertCan, type Actor } from "../auth/permissions";
import { getSetting } from "../settings";

import { AdminError } from "./errors";
import { upsertSeo } from "./seo";

export const PAGE_SIZE = 25;

export type ProductListFilter = {
  q?: string;
  status?: "active" | "inactive";
  categoryId?: string;
  type?: ProductType;
  /** fara: no referral link · nefunctional: last test failed. */
  link?: "fara" | "nefunctional";
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
    ...(filter.categoryId ? { categoryId: filter.categoryId } : {}),
    ...(filter.type ? { productType: filter.type } : {}),
    ...(filter.link === "fara" ? { referralUrl: null } : {}),
    ...(filter.link === "nefunctional" ? { linkStatus: "BROKEN" as const } : {}),
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
        referralUrl: true,
        linkStatus: true,
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
      kitItems: { orderBy: { position: "asc" }, select: { componentId: true, quantity: true } },
      images: {
        orderBy: { position: "asc" },
        select: {
          id: true,
          position: true,
          alt: true,
          media: { select: { url: true, width: true, height: true } },
        },
      },
      _count: { select: { partOfKits: true } },
    },
  });
}

/** Options for the product form's selects. */
export async function getProductFormOptions(actor: Actor) {
  assertCan(actor, "catalog:edit");
  const [categories, brands, needs, aromas, tags, collections, products] = await Promise.all([
    db.category.findMany({
      orderBy: [{ parentId: { sort: "asc", nulls: "first" } }, { position: "asc" }],
      select: { id: true, name: true, parentId: true },
    }),
    db.brand.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.need.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
    db.aromaProfile.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
    db.tag.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    db.collection.findMany({ orderBy: { position: "asc" }, select: { id: true, name: true } }),
    // Candidates for kit contents: any product that is not itself a kit.
    db.product.findMany({
      where: { productType: { not: "KIT" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);
  return { categories, brands, needs, aromas, tags, collections, products };
}

async function assertUnique(
  slug: string,
  sku: string,
  doterraItemNumber: string | null,
  exceptId?: string,
) {
  const clash = await db.product.findFirst({
    where: {
      OR: [{ slug }, { sku }, ...(doterraItemNumber ? [{ doterraItemNumber }] : [])],
      ...(exceptId ? { NOT: { id: exceptId } } : {}),
    },
    select: { slug: true, sku: true, doterraItemNumber: true },
  });
  if (!clash) return;
  const fieldErrors: Record<string, string> = {};
  if (clash.slug === slug) fieldErrors.slug = "Există deja un produs cu acest slug.";
  if (clash.sku === sku) fieldErrors.sku = "Există deja un produs cu acest SKU.";
  if (doterraItemNumber && clash.doterraItemNumber === doterraItemNumber)
    fieldErrors.doterraItemNumber = "Alt produs are deja acest cod doTERRA.";
  throw new AdminError("Unele valori sunt deja folosite de alt produs.", fieldErrors);
}

async function assertAllowedReferralUrl(url: string | null) {
  if (!url) return;
  const { allowedHosts } = await getSetting("affiliate");
  if (!isAllowedReferralUrl(url, allowedHosts)) {
    const message = `Linkul trebuie să fie pe ${allowedHosts.join(" sau ")} (vezi Setări › Linkuri doTERRA).`;
    throw new AdminError(message, { referralUrl: message });
  }
}

/** Creates or updates a product with all its relations in one transaction. */
export async function saveProduct(actor: Actor, raw: unknown, id?: string) {
  assertCan(actor, "catalog:edit");
  const input = productFormSchema.parse(raw);
  await assertUnique(input.slug, input.sku, input.doterraItemNumber, id);
  await assertAllowedReferralUrl(input.referralUrl);

  return db.$transaction(async (tx) => {
    const existing = id
      ? await tx.product.findUnique({
          where: { id },
          select: { id: true, seoId: true, price: true, referralUrl: true },
        })
      : null;
    if (id && !existing) throw new AdminError("Produsul nu mai există.");
    const now = new Date();
    // A new or changed price was just copied from doTERRA; an unchanged one only when confirmed.
    const priceChecked = !existing || existing.price !== input.price || input.priceChecked;
    const linkChanged = existing?.referralUrl !== input.referralUrl;

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
      ...(priceChecked ? { priceCheckedAt: now } : {}),
      referralUrl: input.referralUrl,
      doterraItemNumber: input.doterraItemNumber,
      // A new link has not been tested yet.
      ...(linkChanged ? { linkStatus: "UNCHECKED" as const, linkCheckedAt: null } : {}),
      featured: input.featured,
      active: input.active,
      isDemo: input.isDemo,
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
    if (input.kitItems.some((k) => k.id === product.id))
      throw new AdminError("Un kit nu se poate conține pe el însuși.", {
        kitItems: "Un kit nu se poate conține pe el însuși.",
      });
    await tx.kitItem.deleteMany({ where: { kitId: product.id } });
    if (input.kitItems.length)
      await tx.kitItem.createMany({
        data: input.kitItems.map((k, position) => ({
          kitId: product.id,
          componentId: k.id,
          quantity: k.quantity,
          position,
        })),
      });
    return { id: product.id, slug: product.slug };
  });
}

/**
 * Deletes a product that is not part of a kit (otherwise deactivate it). Archived order lines
 * (legacy_commerce) keep their snapshot; their product link is set to null.
 */
export async function deleteProduct(actor: Actor, id: string) {
  assertCan(actor, "catalog:edit");
  const product = await db.product.findUnique({
    where: { id },
    select: {
      _count: { select: { partOfKits: true } },
      images: { select: { id: true } },
    },
  });
  if (!product) return;
  if (product._count.partOfKits > 0)
    throw new AdminError("Produsul face parte dintr-un kit. Scoate-l din kit sau dezactivează-l.");
  for (const image of product.images) await removeProductImage(actor, id, image.id);
  await db.product.delete({ where: { id } });
}

// ── doTERRA link ────────────────────────────────────────────────────────────

/** "Testează linkul": opens the saved referral link from the server and records a clear result. */
export async function checkProductLink(
  actor: Actor,
  id: string,
  fetcher: typeof fetch = fetch,
): Promise<LinkCheckResult> {
  assertCan(actor, "catalog:edit");
  const product = await db.product.findUnique({ where: { id }, select: { referralUrl: true } });
  if (!product) throw new AdminError("Produsul nu mai există.");
  if (!product.referralUrl) throw new AdminError("Salvează mai întâi un link doTERRA.");
  const { allowedHosts } = await getSetting("affiliate");
  const result = await testReferralLink(product.referralUrl, allowedHosts, fetcher);
  if (result.status !== "UNKNOWN")
    await db.product.update({
      where: { id },
      data: { linkStatus: result.status, linkCheckedAt: new Date() },
    });
  return result;
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
