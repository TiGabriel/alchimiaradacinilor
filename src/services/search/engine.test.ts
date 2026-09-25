import { describe, expect, it } from "vitest";

import {
  buildIndex,
  groupHits,
  levenshtein,
  queryTokens,
  search,
  type SearchDocument,
} from "./engine";

const docs: SearchDocument[] = [
  {
    id: "lavender",
    type: "product",
    title: "Lavender",
    href: "/produs/lavender",
    keywords: ["Flori", "Floral", "Seară"],
  },
  {
    id: "lemon",
    type: "product",
    title: "Lemon",
    href: "/produs/lemon",
    keywords: ["Citrice", "Citric", "Prospețime"],
  },
  {
    id: "peppermint",
    type: "product",
    title: "Peppermint",
    href: "/produs/peppermint",
    keywords: ["Mentolat"],
  },
  {
    id: "tea-tree",
    type: "product",
    title: "Tea Tree",
    href: "/produs/tea-tree",
    keywords: ["Frunze și ierburi"],
  },
  {
    id: "wild-orange",
    type: "product",
    title: "Wild Orange",
    href: "/produs/wild-orange",
    keywords: ["Citrice"],
  },
  {
    id: "diffuser",
    type: "product",
    title: "Difuzor Ceramic Piatră",
    href: "/produs/difuzor",
    keywords: ["Difuzoare"],
  },
  {
    id: "blend",
    type: "product",
    title: "Amestec Liniște de Seară",
    href: "/produs/blend",
    keywords: ["Floral", "Relaxare"],
  },
  {
    id: "cat-citrice",
    type: "category",
    title: "Citrice",
    href: "/produse/uleiuri-individuale/uleiuri-citrice",
  },
  { id: "cat-difuzoare", type: "category", title: "Difuzoare", href: "/produse/difuzoare" },
  { id: "tag-cadou", type: "tag", title: "Idee de cadou", href: "/produse?eticheta=idee-de-cadou" },
];

const index = buildIndex(docs);
const ids = (q: string, types?: string[]) => search(index, q, { types }).map((h) => h.doc.id);

describe("Romanian matching", () => {
  it("ignores diacritics in both directions", () => {
    expect(ids("liniste")).toEqual(["blend"]);
    expect(ids("LINIȘTE")).toEqual(["blend"]);
    expect(ids("piatra")).toEqual(["diffuser"]);
    expect(ids("prospețime")).toEqual(["lemon"]);
  });

  it("maps Romanian names to English product names via synonyms", () => {
    expect(ids("lavandă")[0]).toBe("lavender");
    expect(ids("lavanda")[0]).toBe("lavender");
    expect(ids("lămâie")[0]).toBe("lemon");
    expect(ids("menta")[0]).toBe("peppermint");
    expect(ids("portocală")[0]).toBe("wild-orange");
  });

  it("handles multi-word synonyms", () => {
    expect(ids("arbore de ceai")[0]).toBe("tea-tree");
    expect(ids("portocala salbatica")[0]).toBe("wild-orange");
  });

  it("works English → Romanian too", () => {
    expect(ids("diffuser")).toContain("diffuser");
    expect(ids("diffuser")).toContain("cat-difuzoare");
  });
});

describe("partial and fuzzy matching", () => {
  it("matches prefixes while typing", () => {
    expect(ids("pepp")).toEqual(["peppermint"]);
    expect(ids("lav")[0]).toBe("lavender");
  });

  it("tolerates a typo", () => {
    expect(ids("lavnder")[0]).toBe("lavender");
    expect(ids("pepermint")[0]).toBe("peppermint");
  });

  it("requires every meaningful token to match (stopwords ignored)", () => {
    expect(ids("tea tree")).toEqual(["tea-tree"]);
    expect(ids("lemon difuzor")).toEqual([]);
    expect(ids("idee de cadou")).toEqual(["tag-cadou"]);
  });

  it("returns nothing for blank or unmatched queries", () => {
    expect(ids("   ")).toEqual([]);
    expect(ids("xyzzy")).toEqual([]);
  });
});

describe("ranking and grouping", () => {
  it("ranks title matches above keyword matches", () => {
    expect(ids("citrice")[0]).toBe("cat-citrice");
    expect(ids("citrice")).toEqual(expect.arrayContaining(["lemon", "wild-orange"]));
  });

  it("ranks documents matching in more fields higher", () => {
    const product = ids("citrice", ["product"]);
    expect(product.slice(0, 2).sort()).toEqual(["lemon", "wild-orange"]);
  });

  it("filters by type", () => {
    expect(ids("citrice", ["product"])).not.toContain("cat-citrice");
  });

  it("groups by source in the requested order and caps each group", () => {
    const groups = groupHits(
      search(index, "citrice"),
      [
        { type: "category", label: "Categorii" },
        { type: "product", label: "Produse" },
        { type: "tag", label: "Etichete" },
      ],
      1,
    );
    expect(groups.map((g) => [g.type, g.hits.length, g.total])).toEqual([
      ["category", 1, 1],
      ["product", 1, 2],
    ]);
  });

  it("applies boosts", () => {
    const boosted = buildIndex([
      { id: "a", type: "product", title: "Lemon", href: "/a" },
      { id: "b", type: "product", title: "Lemon", href: "/b", boost: 2 },
    ]);
    expect(search(boosted, "lemon")[0]?.doc.id).toBe("b");
  });
});

describe("helpers", () => {
  it("levenshtein", () => {
    expect(levenshtein("kitten", "sitting")).toBe(3);
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("same", "same")).toBe(0);
  });

  it("queryTokens drops stopwords unless nothing else is left", () => {
    expect(queryTokens("ulei de lavandă")).toEqual(["ulei", "lavanda"]);
    expect(queryTokens("de")).toEqual(["de"]);
  });
});
