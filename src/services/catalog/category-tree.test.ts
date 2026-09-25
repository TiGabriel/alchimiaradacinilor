import { describe, expect, it } from "vitest";

import { buildCategoryTree, categoryHref, findCategoryPath } from "./category-tree";

const rows = [
  {
    id: "b",
    name: "Amestecuri",
    slug: "amestecuri",
    description: null,
    parentId: null,
    position: 1,
    productCount: 3,
  },
  {
    id: "a",
    name: "Uleiuri",
    slug: "uleiuri",
    description: null,
    parentId: null,
    position: 0,
    productCount: 0,
  },
  {
    id: "a2",
    name: "Flori",
    slug: "flori",
    description: null,
    parentId: "a",
    position: 1,
    productCount: 1,
  },
  {
    id: "a1",
    name: "Citrice",
    slug: "citrice",
    description: null,
    parentId: "a",
    position: 0,
    productCount: 2,
  },
];

describe("buildCategoryTree", () => {
  it("nests children, sorts by position and rolls up counts", () => {
    const tree = buildCategoryTree(rows);
    expect(tree.map((c) => c.slug)).toEqual(["uleiuri", "amestecuri"]);
    expect(tree[0]?.children.map((c) => c.slug)).toEqual(["citrice", "flori"]);
    expect(tree[0]?.productCount).toBe(3);
    expect(tree[1]?.productCount).toBe(3);
  });

  it("drops orphans whose parent is inactive/missing", () => {
    const tree = buildCategoryTree([
      ...rows,
      {
        id: "x",
        name: "Orfan",
        slug: "orfan",
        description: null,
        parentId: "missing",
        position: 0,
        productCount: 9,
      },
    ]);
    expect(JSON.stringify(tree)).not.toContain("orfan");
  });
});

describe("findCategoryPath", () => {
  const tree = buildCategoryTree(rows);

  it("resolves category and subcategory slugs", () => {
    expect(findCategoryPath(tree, ["uleiuri"])?.category.slug).toBe("uleiuri");
    const path = findCategoryPath(tree, ["uleiuri", "flori"]);
    expect(path?.subcategory?.slug).toBe("flori");
  });

  it("rejects unknown or mismatched paths", () => {
    expect(findCategoryPath(tree, ["nope"])).toBeNull();
    expect(findCategoryPath(tree, ["amestecuri", "flori"])).toBeNull();
    expect(findCategoryPath(tree, ["uleiuri", "flori", "extra"])).toBeNull();
    expect(findCategoryPath(tree, [])).toBeNull();
  });
});

describe("categoryHref", () => {
  it("builds nested URLs", () => {
    expect(categoryHref({ slug: "uleiuri" })).toBe("/produse/uleiuri");
    expect(categoryHref({ slug: "flori" }, { slug: "uleiuri" })).toBe("/produse/uleiuri/flori");
  });
});
