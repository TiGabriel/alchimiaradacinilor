import { describe, expect, it } from "vitest";

import { pushRecent } from "./recent-searches";

describe("pushRecent", () => {
  it("adds to the front and trims whitespace", () => {
    expect(pushRecent(["lemon"], "  lavandă  ")).toEqual(["lavandă", "lemon"]);
  });

  it("de-duplicates ignoring case and diacritics", () => {
    expect(pushRecent(["Lavanda", "lemon"], "lavandă")).toEqual(["lavandă", "lemon"]);
  });

  it("caps the list and ignores blank queries", () => {
    expect(pushRecent(["a", "b", "c"], "d", 3)).toEqual(["d", "a", "b"]);
    expect(pushRecent(["a"], "   ")).toEqual(["a"]);
  });
});
