import { describe, expect, it } from "vitest";

import { csvCell, toCsv } from "./csv";

describe("csv", () => {
  it("quotes separators and neutralises formulas", () => {
    expect(csvCell("ana@example.ro")).toBe("ana@example.ro");
    expect(csvCell('a,"b"')).toBe('"a,""b"""');
    expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvCell("+40722")).toBe("'+40722");
    expect(csvCell(null)).toBe("");
  });

  it("builds a spreadsheet-friendly file", () => {
    expect(toCsv(["email", "sursă"], [["ana@example.ro", "prima pagină"]])).toBe(
      "﻿email,sursă\r\nana@example.ro,prima pagină\r\n",
    );
  });
});
