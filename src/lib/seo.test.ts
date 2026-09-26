import { describe, expect, it } from "vitest";

import { buildMetadata, clampDescription, DEFAULT_OG_IMAGE } from "./seo";

const defaults = { siteName: "Alchimia", description: "Descriere implicită.", image: null };

describe("clampDescription", () => {
  it("keeps short text and collapses whitespace", () => {
    expect(clampDescription("  Aromă  florală\npentru seară ")).toBe("Aromă florală pentru seară");
  });

  it("cuts long text at a word boundary with an ellipsis", () => {
    const out = clampDescription("cuvânt ".repeat(40), 50);
    expect(out.length).toBeLessThanOrEqual(50);
    expect(out.endsWith("cuvânt…")).toBe(true);
  });
});

describe("buildMetadata", () => {
  it("fills Open Graph, Twitter and canonical from the page", () => {
    const meta = buildMetadata(
      {
        title: "Lavandă",
        description: "Aromă florală.",
        path: "/produs/lavanda",
        image: "/a.webp",
      },
      defaults,
    );
    expect(meta.alternates?.canonical).toBe("/produs/lavanda");
    expect(meta.robots).toBeUndefined();
    expect(meta.openGraph).toMatchObject({
      url: "/produs/lavanda",
      title: "Lavandă",
      siteName: "Alchimia",
      locale: "ro_RO",
      images: [{ url: "/a.webp", alt: "Lavandă" }],
    });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", title: "Lavandă" });
  });

  it("falls back to the default description and image", () => {
    const meta = buildMetadata({ title: "Rutine", path: "/rutine", description: " " }, defaults);
    expect(meta.description).toBe("Descriere implicită.");
    expect(meta.openGraph?.images).toEqual([{ url: DEFAULT_OG_IMAGE, alt: "Rutine" }]);
    const withSetting = buildMetadata(
      { title: "Rutine", path: "/rutine" },
      { ...defaults, image: "/uploads/site/og.webp" },
    );
    expect(withSetting.openGraph?.images).toEqual([
      { url: "/uploads/site/og.webp", alt: "Rutine" },
    ]);
  });

  it("honours editor canonical, noindex and article dates", () => {
    const published = new Date("2026-03-01T10:00:00Z");
    const meta = buildMetadata(
      {
        title: "Articol",
        path: "/jurnal/articol",
        canonical: "https://exemplu.ro/original",
        noIndex: true,
        type: "article",
        publishedTime: published,
        authors: ["Ana"],
      },
      defaults,
    );
    expect(meta.alternates?.canonical).toBe("https://exemplu.ro/original");
    expect(meta.robots).toEqual({ index: false, follow: true });
    expect(meta.openGraph).toMatchObject({
      type: "article",
      publishedTime: published.toISOString(),
      authors: ["Ana"],
    });
  });
});
