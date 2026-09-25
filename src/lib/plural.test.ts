import { describe, expect, it } from "vitest";

import { pluralRo } from "./plural";

describe("pluralRo", () => {
  it.each([
    [0, "0 produse"],
    [1, "1 produs"],
    [2, "2 produse"],
    [19, "19 produse"],
    [20, "20 de produse"],
    [100, "100 de produse"],
    [101, "101 produse"],
    [119, "119 produse"],
    [120, "120 de produse"],
  ])("%i → %s", (n, expected) => {
    expect(pluralRo(n, "produs", "produse")).toBe(expected);
  });
});
