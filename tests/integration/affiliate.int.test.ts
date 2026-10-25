import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it } from "vitest";
import { z } from "zod";

import { GET, HEAD } from "@/app/spre-doterra/[slug]/route";
import { db } from "@/lib/db";
import { getDashboard } from "@/services/admin/dashboard";
import { AdminError } from "@/services/admin/errors";
import { checkProductLink, saveProduct } from "@/services/admin/products";
import { limiters } from "@/services/auth/rate-limit";
import type { Actor } from "@/services/auth/permissions";

import { makeProduct, makeVerifiedUser } from "./helpers";

const LINK = "https://www.doterra.com/RO/ro_RO/p/lavender-oil?referralId=123";
const BROWSER =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36";

async function admin(): Promise<Actor> {
  const user = await makeVerifiedUser({ email: "admin@example.ro" });
  return { id: user.id, roles: ["admin"] };
}

async function productInput(overrides: Record<string, unknown> = {}) {
  const category = await db.category.upsert({
    where: { slug: "uleiuri" },
    create: { slug: "uleiuri", name: "Uleiuri" },
    update: {},
  });
  return {
    name: "Lavandă Test",
    slug: "lavanda-test",
    sku: "LAV-TEST",
    brandId: "",
    categoryId: category.id,
    productType: "INDIVIDUAL_OIL",
    shortDescription: "Aromă florală pentru serile liniștite.",
    description: "O notă florală moale, potrivită ritualurilor de seară și momentelor calme.",
    usageInfo: "",
    safetyInfo: "",
    price: "59,90",
    needs: [],
    aromas: [],
    tagIds: [],
    attributes: { volumeMl: "10" },
    seo: { seoTitle: "Lavandă", metaDescription: "", noIndex: false },
    ...overrides,
  };
}

const fieldErrors = (promise: Promise<unknown>) =>
  promise.then(
    () => ({}),
    // Same mapping as adminAction: schema errors and service errors both become field errors.
    (error: unknown) =>
      error instanceof z.ZodError
        ? Object.fromEntries(error.issues.map((i) => [i.path.join("."), i.message]))
        : error instanceof AdminError
          ? (error.fieldErrors ?? {})
          : { error },
  );

function visit(slug: string, init: { method?: string; ua?: string; query?: string } = {}) {
  const request = new NextRequest(
    `http://localhost/spre-doterra/${slug}${init.query ?? "?sursa=produs"}`,
    {
      method: init.method ?? "GET",
      headers: { "user-agent": init.ua ?? BROWSER, "x-forwarded-for": "203.0.113.7" },
    },
  );
  const ctx = { params: Promise.resolve({ slug }) };
  return init.method === "HEAD" ? HEAD(request, ctx) : GET(request, ctx);
}

const clicks = () =>
  db.outboundClickDaily.findMany({
    select: { source: true, count: true },
    orderBy: { source: "asc" },
  });

beforeEach(() => {
  limiters.outboundByIp.reset("203.0.113.7");
});

describe("doTERRA links in the admin", () => {
  it("accepts only https links on an allowed doTERRA domain", async () => {
    const actor = await admin();
    for (const referralUrl of [
      "http://www.doterra.com/RO/ro_RO/p/lavender-oil",
      "https://doterra.com.evil.example/p/lavender-oil",
      "https://example.com/?u=doterra.com",
    ])
      expect(
        await fieldErrors(saveProduct(actor, await productInput({ referralUrl }))),
      ).toHaveProperty("referralUrl");
    expect(await db.product.count()).toBe(0);
  });

  it("saves a new link as untested and dates the price", async () => {
    const actor = await admin();
    const { id } = await saveProduct(
      actor,
      await productInput({ referralUrl: ` ${LINK} `, doterraItemNumber: "30010001" }),
    );
    const saved = await db.product.findUniqueOrThrow({ where: { id } });
    expect(saved).toMatchObject({
      referralUrl: LINK,
      doterraItemNumber: "30010001",
      linkStatus: "UNCHECKED",
      linkCheckedAt: null,
    });
    expect(saved.priceCheckedAt).toBeInstanceOf(Date);

    // An unchanged price keeps its date unless the admin confirms it was checked again.
    const checkedAt = new Date("2026-01-01T10:00:00Z");
    await db.product.update({
      where: { id },
      data: { priceCheckedAt: checkedAt, linkStatus: "OK", linkCheckedAt: checkedAt },
    });
    await saveProduct(actor, await productInput({ referralUrl: LINK }), id);
    const kept = await db.product.findUniqueOrThrow({ where: { id } });
    expect(kept.priceCheckedAt).toEqual(checkedAt);
    expect(kept.linkStatus).toBe("OK");
    expect(kept.doterraItemNumber).toBeNull();

    await saveProduct(actor, await productInput({ referralUrl: LINK, priceChecked: true }), id);
    expect((await db.product.findUniqueOrThrow({ where: { id } })).priceCheckedAt).not.toEqual(
      checkedAt,
    );

    // A different link has to be tested again; an empty one means "Link în curând".
    await saveProduct(actor, await productInput({ referralUrl: `${LINK}&x=1` }), id);
    expect(await db.product.findUniqueOrThrow({ where: { id } })).toMatchObject({
      linkStatus: "UNCHECKED",
      linkCheckedAt: null,
    });
    await saveProduct(actor, await productInput({ referralUrl: "" }), id);
    expect((await db.product.findUniqueOrThrow({ where: { id } })).referralUrl).toBeNull();
  });

  it("refuses a doTERRA item number that another product already has", async () => {
    const actor = await admin();
    await saveProduct(actor, await productInput({ doterraItemNumber: "30010001" }));
    const errors = await fieldErrors(
      saveProduct(
        actor,
        await productInput({ slug: "alt-produs", sku: "ALT", doterraItemNumber: "30010001" }),
      ),
    );
    expect(errors).toHaveProperty("doterraItemNumber");
  });

  it("records a clear test result and leaves the status alone when doTERRA is unclear", async () => {
    const actor = await admin();
    const { id } = await saveProduct(actor, await productInput({ referralUrl: LINK }));
    const answer = (status: number, location?: string) => async () =>
      new Response(null, { status, headers: location ? { location } : {} });

    expect((await checkProductLink(actor, id, answer(200))).status).toBe("OK");
    expect(await db.product.findUniqueOrThrow({ where: { id } })).toMatchObject({
      linkStatus: "OK",
      linkCheckedAt: expect.any(Date),
    });

    expect((await checkProductLink(actor, id, answer(404))).status).toBe("BROKEN");
    expect((await db.product.findUniqueOrThrow({ where: { id } })).linkStatus).toBe("BROKEN");

    // A redirect away from doTERRA is never followed and does not change the status.
    let calls = 0;
    const away = async () => (
      calls++,
      new Response(null, { status: 302, headers: { location: "https://example.com/" } })
    );
    expect((await checkProductLink(actor, id, away)).status).toBe("UNKNOWN");
    expect(calls).toBe(1);
    expect((await db.product.findUniqueOrThrow({ where: { id } })).linkStatus).toBe("BROKEN");
  });
});

describe("/spre-doterra/[slug]", () => {
  it("counts a visitor's click per day and source, then redirects to doTERRA", async () => {
    const product = await makeProduct({ slug: "lavanda" });
    await db.product.update({ where: { id: product.id }, data: { referralUrl: LINK } });

    const response = await visit("lavanda");
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(LINK);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("x-robots-tag")).toContain("noindex");
    await visit("lavanda");
    await visit("lavanda", { query: "?sursa=quiz" });
    await visit("lavanda", { query: "?sursa=<script>" });
    expect(await clicks()).toEqual([
      { source: "altul", count: 1 },
      { source: "produs", count: 2 },
      { source: "quiz", count: 1 },
    ]);
  });

  it("does not count bots, HEAD requests or prefetches", async () => {
    const product = await makeProduct({ slug: "lavanda" });
    await db.product.update({ where: { id: product.id }, data: { referralUrl: LINK } });

    const head = await visit("lavanda", { method: "HEAD" });
    expect(head.headers.get("location")).toBe(LINK);
    expect(
      (await visit("lavanda", { ua: "Googlebot/2.1 (+http://www.google.com/bot.html)" })).status,
    ).toBe(302);
    expect((await visit("lavanda", { ua: "" })).status).toBe(302);
    const prefetch = new NextRequest("http://localhost/spre-doterra/lavanda", {
      headers: { "user-agent": BROWSER, "sec-purpose": "prefetch" },
    });
    await GET(prefetch, { params: Promise.resolve({ slug: "lavanda" }) });
    expect(await clicks()).toEqual([]);
  });

  it("stops counting a single address after the limit but still redirects", async () => {
    const product = await makeProduct({ slug: "lavanda" });
    await db.product.update({ where: { id: product.id }, data: { referralUrl: LINK } });
    for (let i = 0; i < 35; i++)
      expect((await visit("lavanda")).headers.get("location")).toBe(LINK);
    expect(await clicks()).toEqual([{ source: "produs", count: 30 }]);
  });

  it("sends visitors back to the site when there is no usable link", async () => {
    const product = await makeProduct({ slug: "fara-link" });
    expect((await visit("fara-link")).headers.get("location")).toBe(
      "http://localhost/produs/fara-link",
    );

    // A link that no longer matches the allowed domains is never used.
    await db.product.update({
      where: { id: product.id },
      data: { referralUrl: "https://example.com/lavanda" },
    });
    expect((await visit("fara-link")).headers.get("location")).toBe(
      "http://localhost/produs/fara-link",
    );

    await db.product.update({
      where: { id: product.id },
      data: { active: false, referralUrl: LINK },
    });
    expect((await visit("fara-link")).headers.get("location")).toBe("http://localhost/produse");
    expect((await visit("nu-exista")).headers.get("location")).toBe("http://localhost/produse");
    expect(await clicks()).toEqual([]);
  });
});

describe("dashboard", () => {
  it("shows outbound clicks and the active products still without a link", async () => {
    const actor = await admin();
    const product = await makeProduct({ slug: "lavanda" });
    await makeProduct({ slug: "fara-link" });
    await db.product.update({ where: { id: product.id }, data: { referralUrl: LINK } });
    await visit("lavanda");
    await visit("lavanda", { query: "?sursa=quiz" });

    const { outbound } = await getDashboard(actor);
    expect(outbound.clicks).toBe(2);
    expect(outbound.withoutLink).toBe(1);
    expect(outbound.topProducts).toEqual([{ label: "Produs lavanda", value: 2 }]);
    expect(outbound.bySource).toHaveLength(2);
  });
});
