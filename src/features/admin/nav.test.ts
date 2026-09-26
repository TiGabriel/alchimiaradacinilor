import { describe, expect, it } from "vitest";

import { assertCan, ForbiddenError } from "@/services/auth/permissions";

import { activeNavHref, navFor } from "./nav";

const hrefs = (roles: string[]) => navFor(roles).flatMap((g) => g.items.map((i) => i.href));

describe("admin authorization", () => {
  it("shows admins everything and everyone else nothing", () => {
    expect(hrefs(["admin"])).toContain("/admin/comenzi");
    expect(hrefs(["admin"])).toContain("/admin/produse");
    expect(hrefs(["editor"])).toEqual([]);
    expect(hrefs(["customer"])).toEqual([]);
    expect(hrefs([])).toEqual([]);
  });

  it("services refuse actors without the permission", () => {
    expect(() => assertCan({ id: "u", roles: ["editor"] }, "orders:manage")).toThrow(
      ForbiddenError,
    );
    expect(() => assertCan({ id: "u", roles: ["customer"] }, "catalog:edit")).toThrow(
      ForbiddenError,
    );
    expect(() => assertCan({ id: "u", roles: ["admin"] }, "settings:manage")).not.toThrow();
    expect(() => assertCan({ id: "u", roles: ["editor"] }, "catalog:edit")).toThrow(ForbiddenError);
  });

  it("highlights the deepest matching section", () => {
    const groups = navFor(["admin"]);
    expect(activeNavHref("/admin", groups)).toBe("/admin");
    expect(activeNavHref("/admin/produse/123", groups)).toBe("/admin/produse");
    expect(activeNavHref("/admin/necunoscut", groups)).toBeNull();
  });
});
