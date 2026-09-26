import { describe, expect, it } from "vitest";

import { latestConsents, isGranted } from "../consent/latest";

import { hashPassword, verifyAgainstDummy, verifyPassword } from "./password";
import { assertCan, can, ForbiddenError, hasRole, PERMISSIONS } from "./permissions";
import { SlidingWindowLimiter, retryAfterText } from "./rate-limit";
import { generateToken, hashIp, hashToken } from "./tokens";

describe("password hashing", () => {
  it("uses argon2id and verifies only the right password", async () => {
    const hash = await hashPassword("parola-sigura-123");
    expect(hash.startsWith("$argon2id$")).toBe(true);
    expect(hash).not.toContain("parola-sigura-123");
    expect(await verifyPassword(hash, "parola-sigura-123")).toBe(true);
    expect(await verifyPassword(hash, "parola-gresita-123")).toBe(false);
  });

  it("salts every hash", async () => {
    expect(await hashPassword("aceeasi-parola-1")).not.toBe(await hashPassword("aceeasi-parola-1"));
  });

  it("treats malformed hashes as a failed verification", async () => {
    expect(await verifyPassword("not-a-hash", "x")).toBe(false);
    expect(await verifyAgainstDummy("orice")).toBe(false);
  });
});

describe("tokens", () => {
  it("generates long unique URL-safe tokens and stable hashes", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(hashToken(a)).toBe(hashToken(a));
    expect(hashToken(a)).toMatch(/^[0-9a-f]{64}$/);
  });

  it("pseudonymises IPs with a salt", () => {
    expect(hashIp("1.2.3.4", "s1")).not.toBe(hashIp("1.2.3.4", "s2"));
    expect(hashIp(null, "s")).toBeNull();
  });
});

describe("SlidingWindowLimiter", () => {
  it("allows up to the limit, then blocks until the window slides", () => {
    let now = 0;
    const limiter = new SlidingWindowLimiter(3, 1000, () => now);
    expect([1, 2, 3].map(() => limiter.check("k").allowed)).toEqual([true, true, true]);
    const blocked = limiter.check("k");
    expect(blocked).toMatchObject({ allowed: false, remaining: 0 });
    expect(blocked.retryAfterMs).toBe(1000);
    now = 1001;
    expect(limiter.check("k").allowed).toBe(true);
  });

  it("keeps keys independent and can be reset", () => {
    const limiter = new SlidingWindowLimiter(1, 1000, () => 0);
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("b").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);
    limiter.reset("a");
    expect(limiter.check("a").allowed).toBe(true);
  });

  it("formats retry times in Romanian", () => {
    expect(retryAfterText(10_000)).toBe("un minut");
    expect(retryAfterText(5 * 60_000)).toBe("5 minute");
  });
});

describe("permissions", () => {
  it("grants admin everything and customers only their own account", () => {
    expect(can(["admin"], "admin:access")).toBe(true);
    expect(can(["admin"], "settings:manage")).toBe(true);
    expect(can(["customer"], "account:manage-own")).toBe(true);
    expect(can(["customer"], "admin:access")).toBe(false);
    expect(can(["editor"], "catalog:edit")).toBe(true);
    expect(can(["editor"], "users:manage")).toBe(false);
  });

  it("gives editors the catalogue and content, never orders, customers or settings", () => {
    const allowed = PERMISSIONS.filter((p) => can(["editor"], p));
    expect(allowed).toEqual(["account:manage-own", "admin:access", "catalog:edit", "content:edit"]);
    // Several roles combine; a customer who is also an editor gets the editor's rights.
    expect(can(["customer", "editor"], "content:edit")).toBe(true);
  });

  it("assertCan throws a ForbiddenError naming the missing permission", () => {
    const editor = { id: "u1", roles: ["editor"] };
    expect(() => assertCan(editor, "catalog:edit")).not.toThrow();
    try {
      assertCan(editor, "settings:manage");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ForbiddenError);
      expect((error as ForbiddenError).permission).toBe("settings:manage");
    }
  });

  it("ignores unknown roles and empty role lists", () => {
    expect(can(["superuser"], "admin:access")).toBe(false);
    expect(can([], "account:manage-own")).toBe(false);
    expect(hasRole(["customer", "admin"], "admin")).toBe(true);
  });
});

describe("latestConsents", () => {
  const at = (m: number) => new Date(Date.UTC(2026, 0, 1, 0, m));
  const records = [
    { purpose: "NEWSLETTER", granted: true, createdAt: at(1), policyVersion: "v1" },
    { purpose: "PRIVACY_POLICY", granted: true, createdAt: at(1), policyVersion: "v1" },
    { purpose: "NEWSLETTER", granted: false, createdAt: at(5), policyVersion: "v1" },
  ];

  it("returns the most recent record per purpose", () => {
    const latest = latestConsents(records);
    expect(latest.get("NEWSLETTER")?.granted).toBe(false);
    expect(latest.get("PRIVACY_POLICY")?.granted).toBe(true);
  });

  it("treats a withdrawn or missing consent as not granted", () => {
    expect(isGranted(records, "NEWSLETTER")).toBe(false);
    expect(isGranted(records, "PERSONALIZATION")).toBe(false);
    expect(
      isGranted(
        [
          ...records,
          { purpose: "NEWSLETTER", granted: true, createdAt: at(9), policyVersion: "v2" },
        ],
        "NEWSLETTER",
      ),
    ).toBe(true);
  });
});
