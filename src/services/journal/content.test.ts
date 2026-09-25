import { describe, expect, it } from "vitest";

import {
  embeddedSlugs,
  parseArticleContent,
  rankRelatedArticles,
  readingTimeMinutes,
} from "./content";

describe("parseArticleContent", () => {
  it("splits prose and embedded cards", () => {
    const blocks = parseArticleContent(
      "Intro\n\n{{produs:lavender}}\n\n## Titlu\nText\n{{rutina:ritual-de-seara}}\nFinal",
    );
    expect(blocks).toEqual([
      { type: "markdown", text: "Intro" },
      { type: "product", slug: "lavender" },
      { type: "markdown", text: "## Titlu\nText" },
      { type: "routine", slug: "ritual-de-seara" },
      { type: "markdown", text: "Final" },
    ]);
    expect(embeddedSlugs(blocks)).toEqual({
      products: ["lavender"],
      routines: ["ritual-de-seara"],
    });
  });

  it("only treats whole, well-formed lines as embeds", () => {
    const blocks = parseArticleContent(
      "Vezi {{produs:lavender}} aici\n{{produs:<script>}}\n{{altceva:x}}",
    );
    expect(blocks).toEqual([
      {
        type: "markdown",
        text: "Vezi {{produs:lavender}} aici\n{{produs:<script>}}\n{{altceva:x}}",
      },
    ]);
  });

  it("keeps raw HTML as text for the renderer to escape", () => {
    expect(parseArticleContent("<img src=x onerror=alert(1)>")).toEqual([
      { type: "markdown", text: "<img src=x onerror=alert(1)>" },
    ]);
  });
});

describe("readingTimeMinutes", () => {
  it("counts about 200 words per minute, minimum 1", () => {
    expect(readingTimeMinutes("scurt")).toBe(1);
    expect(readingTimeMinutes(Array(1000).fill("cuvânt").join(" "))).toBe(5);
    expect(readingTimeMinutes(`${Array(400).fill("a").join(" ")}\n{{produs:lavender}}`)).toBe(2);
  });
});

describe("rankRelatedArticles", () => {
  const at = (d: number) => new Date(Date.UTC(2026, 0, d));
  const base = { tagIds: [], productIds: [], routineIds: [] };
  const source = {
    ...base,
    id: "s",
    categoryId: "uleiuri",
    productIds: ["lavender"],
    routineIds: ["seara"],
    publishedAt: at(10),
  };
  const others = [
    { ...base, id: "same-category", categoryId: "uleiuri", publishedAt: at(1) },
    {
      ...base,
      id: "shares-routine",
      categoryId: "rutine",
      routineIds: ["seara"],
      publishedAt: at(2),
    },
    {
      ...base,
      id: "shares-product",
      categoryId: "ghiduri",
      productIds: ["lavender"],
      publishedAt: at(3),
    },
    { ...base, id: "unrelated", categoryId: "casa", publishedAt: at(9) },
    source,
  ];

  it("ranks by shared category, routines, products and tags", () => {
    expect(rankRelatedArticles(source, others, 5)).toEqual([
      "same-category",
      "shares-routine",
      "shares-product",
    ]);
    expect(rankRelatedArticles(source, others, 1)).toEqual(["same-category"]);
  });
});
