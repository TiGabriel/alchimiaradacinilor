import { describe, expect, it } from "vitest";

import { slugify } from "./slug";
import { foldDiacritics, normalizeForSearch, tokenize } from "./text";

describe("foldDiacritics", () => {
  it("folds comma-below and cedilla forms alike", () => {
    expect(foldDiacritics("Ăă Ââ Îî Șș Țț")).toBe("aa aa ii ss tt");
    expect(foldDiacritics("Şş Ţţ")).toBe("ss tt");
  });
});

describe("normalizeForSearch / tokenize", () => {
  it("strips punctuation and collapses whitespace", () => {
    expect(normalizeForSearch("  Lavandă, (demo)!  ")).toBe("lavanda demo");
    expect(tokenize("Ulei de lămâie — 15 ml")).toEqual(["ulei", "de", "lamaie", "15", "ml"]);
    expect(tokenize("   ")).toEqual([]);
  });
});

describe("slugify", () => {
  it("produces ASCII slugs from Romanian text", () => {
    expect(slugify("Uleiuri individuale")).toBe("uleiuri-individuale");
    expect(slugify("Îngrijire personală")).toBe("ingrijire-personala");
    expect(slugify("Kit-uri & Accesorii")).toBe("kit-uri-accesorii");
  });
});
