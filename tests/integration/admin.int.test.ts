import sharp from "sharp";
import { describe, expect, it } from "vitest";

import { db } from "@/lib/db";
import { readLocalObject } from "@/lib/storage/local";
import { getDashboard } from "@/services/admin/dashboard";
import { AdminError } from "@/services/admin/errors";
import {
  adminChangeOrderStatus,
  adminMarkOrderPaid,
  listAdminOrders,
} from "@/services/admin/orders";
import {
  addProductImage,
  deleteProduct,
  getAdminProduct,
  listAdminProducts,
  removeProductImage,
  reorderProductImages,
  saveProduct,
  setProductThumbnail,
} from "@/services/admin/products";
import { deleteTaxonomy, saveTaxonomy } from "@/services/admin/taxonomy";
import { ForbiddenError, type Actor } from "@/services/auth/permissions";

import { makeProduct, makeVerifiedUser, placeTestOrder } from "./helpers";

async function actors() {
  const admin = await makeVerifiedUser({ email: "admin@example.ro" });
  const editor = await makeVerifiedUser({ email: "editor@example.ro" });
  return {
    admin: { id: admin.id, roles: ["admin"] } as Actor,
    editor: { id: editor.id, roles: ["editor"] } as Actor,
    customer: { id: editor.id, roles: ["customer"] } as Actor,
  };
}

async function category(slug = "uleiuri") {
  return db.category.create({ data: { slug, name: slug } });
}

function productInput(categoryId: string, overrides: Record<string, unknown> = {}) {
  return {
    name: "Lavandă Test",
    slug: "lavanda-test",
    sku: "LAV-TEST",
    brandId: "",
    categoryId,
    productType: "INDIVIDUAL_OIL",
    shortDescription: "Aromă florală pentru serile liniștite.",
    description: "O notă florală moale, potrivită ritualurilor de seară și momentelor calme.",
    usageInfo: "",
    safetyInfo: "",
    price: "59,90",
    compareAtPrice: "",
    stock: "10",
    needs: [],
    aromas: [],
    tagIds: [],
    attributes: { volumeMl: "10" },
    seo: { seoTitle: "Lavandă", metaDescription: "", noIndex: false },
    ...overrides,
  };
}

const jpeg = (color: string) =>
  sharp({ create: { width: 400, height: 400, channels: 3, background: color } })
    .jpeg()
    .toBuffer();

describe("admin authorization", () => {
  it("services refuse actors without the right permission", async () => {
    const { editor, customer, admin } = await actors();
    const cat = await category();
    await expect(listAdminOrders(editor, {})).rejects.toBeInstanceOf(ForbiddenError);
    await expect(saveProduct(customer, productInput(cat.id))).rejects.toBeInstanceOf(
      ForbiddenError,
    );
    await expect(
      saveTaxonomy(customer, "etichete", { name: "Nou", slug: "nou" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    await expect(listAdminProducts(editor, {})).resolves.toMatchObject({ total: 0 });
    await expect(listAdminOrders(admin, {})).resolves.toMatchObject({ total: 0 });
    expect((await getDashboard(editor)).sales).toBe(false);
    expect((await getDashboard(admin)).sales).toBe(true);
  });
});

describe("product admin", () => {
  it("creates and updates a product with its relations and SEO", async () => {
    const { editor } = await actors();
    const cat = await category();
    const need = await db.need.create({ data: { slug: "seara", name: "Seară" } });
    const aroma = await db.aromaProfile.create({ data: { slug: "floral", name: "Floral" } });
    const tag = await db.tag.create({ data: { slug: "nou", name: "Nou" } });

    const { id } = await saveProduct(
      editor,
      productInput(cat.id, {
        needs: [{ id: need.id, relevance: 3 }],
        aromas: [{ id: aroma.id, intensity: 5 }],
        tagIds: [tag.id],
      }),
    );
    let product = await getAdminProduct(editor, id);
    expect(product).toMatchObject({
      price: 5990,
      stock: 10,
      sku: "LAV-TEST",
      attributes: { volumeMl: 10 },
    });
    expect(product?.seo).toMatchObject({ seoTitle: "Lavandă" });
    expect(product?.needs).toEqual([{ needId: need.id, relevance: 3 }]);

    await saveProduct(editor, productInput(cat.id, { price: "64,90", needs: [], tagIds: [] }), id);
    product = await getAdminProduct(editor, id);
    expect(product).toMatchObject({ price: 6490 });
    expect(product?.needs).toEqual([]);
    expect(product?.tags).toEqual([]);
    expect(product?.aromaProfiles).toEqual([]);
  });

  it("reports slug/SKU clashes on the fields", async () => {
    const { editor } = await actors();
    const cat = await category();
    await saveProduct(editor, productInput(cat.id));
    const clash = await saveProduct(editor, productInput(cat.id, { sku: "ALT-SKU" })).catch(
      (e) => e,
    );
    expect(clash).toBeInstanceOf(AdminError);
    expect(clash.fieldErrors).toHaveProperty("slug");
  });

  it("uploads, reorders, picks the thumbnail and removes images", async () => {
    const { editor } = await actors();
    const product = await makeProduct();
    for (const color of ["#aa0000", "#00aa00", "#0000aa"])
      await addProductImage(editor, product.id, new Blob([new Uint8Array(await jpeg(color))]), "");
    const images = async () =>
      (
        await db.productImage.findMany({
          where: { productId: product.id },
          orderBy: { position: "asc" },
        })
      ).map((i) => i.id);
    const [a, b, c] = await images();
    await reorderProductImages(editor, product.id, [c!, a!, b!]);
    expect(await images()).toEqual([c, a, b]);
    await setProductThumbnail(editor, product.id, b!);
    expect(await images()).toEqual([b, c, a]);
    await expect(reorderProductImages(editor, product.id, [a!, b!])).rejects.toBeInstanceOf(
      AdminError,
    );

    const media = await db.productImage.findUniqueOrThrow({
      where: { id: c! },
      include: { media: true },
    });
    await removeProductImage(editor, product.id, c!);
    expect(await images()).toEqual([b, a]);
    expect(await readLocalObject(media.media.storageKey)).toBeNull();
    const positions = await db.productImage.findMany({
      where: { productId: product.id },
      select: { position: true },
    });
    expect(positions.map((p) => p.position).sort()).toEqual([0, 1]);
    for (const id of await images()) await removeProductImage(editor, product.id, id);
  });

  it("deletes only products that were never ordered", async () => {
    const { editor } = await actors();
    const ordered = await makeProduct();
    const unused = await makeProduct();
    const buyer = await makeVerifiedUser({ email: "b@example.ro" });
    await placeTestOrder(buyer.id, [ordered.id]);
    await expect(deleteProduct(editor, ordered.id)).rejects.toThrow("Dezactivează-l");
    await deleteProduct(editor, unused.id);
    expect(await db.product.findUnique({ where: { id: unused.id } })).toBeNull();
  });
});

describe("taxonomy admin", () => {
  it("prevents category cycles and deleting categories in use", async () => {
    const { editor } = await actors();
    const root = await category("root");
    const child = await db.category.create({
      data: { slug: "child", name: "Child", parentId: root.id },
    });
    const cycle = await saveTaxonomy(
      editor,
      "categorii",
      { name: "Root", slug: "root", parentId: child.id },
      root.id,
    ).catch((e) => e);
    expect(cycle).toBeInstanceOf(AdminError);
    expect(cycle.fieldErrors).toHaveProperty("parentId");
    await expect(deleteTaxonomy(editor, "categorii", root.id)).rejects.toThrow("subcategorii");
    await makeProduct(); // lands in the helper's "test" category
    const used = await db.category.findUniqueOrThrow({ where: { slug: "test" } });
    await expect(deleteTaxonomy(editor, "categorii", used.id)).rejects.toThrow("produse");
    await deleteTaxonomy(editor, "categorii", child.id);
  });

  it("reports duplicate slugs on the slug field", async () => {
    const { editor } = await actors();
    await saveTaxonomy(editor, "etichete", { name: "Nou", slug: "nou" });
    const dup = await saveTaxonomy(editor, "etichete", { name: "Nou 2", slug: "nou" }).catch(
      (e) => e,
    );
    expect(dup).toBeInstanceOf(AdminError);
    expect(dup.fieldErrors).toHaveProperty("slug");
  });
});

describe("orders admin", () => {
  it("changes status along allowed transitions and records payment once", async () => {
    const { admin } = await actors();
    const product = await makeProduct({ stock: 5 });
    const buyer = await makeVerifiedUser({ email: "b@example.ro" });
    const order = await placeTestOrder(buyer.id, [product.id]);

    await expect(
      adminChangeOrderStatus(admin, { orderId: order.id, to: "DELIVERED", notify: false }),
    ).rejects.toBeInstanceOf(AdminError);
    await adminChangeOrderStatus(admin, {
      orderId: order.id,
      to: "CONFIRMED",
      note: "Confirmată telefonic",
      notify: false,
    });
    await adminMarkOrderPaid(admin, order.id);
    await expect(adminMarkOrderPaid(admin, order.id)).rejects.toThrow("deja");
    const events = await db.orderStatusEvent.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "asc" },
    });
    expect(events.map((e) => [e.status, e.paymentStatus, e.actorId === admin.id])).toEqual([
      ["PENDING", "UNPAID", false],
      ["CONFIRMED", "UNPAID", true],
      ["CONFIRMED", "PAID", true],
    ]);
  });
});
