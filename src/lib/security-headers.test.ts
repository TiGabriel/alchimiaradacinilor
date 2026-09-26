import { describe, expect, it } from "vitest";

import { buildCsp, createNonce, originOf, staticSecurityHeaders } from "./security-headers";

function directive(csp: string, name: string) {
  return csp
    .split("; ")
    .find((d) => d.startsWith(`${name} `) || d === name)
    ?.split(" ")
    .slice(1);
}

describe("buildCsp", () => {
  it("allows only nonce-marked scripts in production", () => {
    const csp = buildCsp({ nonce: "abc", dev: false });
    expect(directive(csp, "script-src")).toEqual(["'self'", "'nonce-abc'", "'strict-dynamic'"]);
    expect(csp).not.toContain("unsafe-eval");
    expect(directive(csp, "object-src")).toEqual(["'none'"]);
    expect(directive(csp, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(csp, "form-action")).toEqual(["'self'"]);
    expect(csp).not.toContain("upgrade-insecure-requests");
  });

  it("adds dev allowances, image origins and the HTTPS upgrade when asked", () => {
    const csp = buildCsp({
      nonce: "n",
      dev: true,
      imageOrigins: ["https://cdn.exemplu.ro"],
      upgradeInsecureRequests: true,
    });
    expect(directive(csp, "script-src")).toContain("'unsafe-eval'");
    expect(directive(csp, "img-src")).toContain("https://cdn.exemplu.ro");
    expect(csp.endsWith("upgrade-insecure-requests")).toBe(true);
  });
});

describe("helpers", () => {
  it("creates distinct base64 nonces", () => {
    const a = createNonce();
    expect(a).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(a).not.toBe(createNonce());
  });

  it("extracts origins safely", () => {
    expect(originOf("https://cdn.exemplu.ro/bucket/x")).toBe("https://cdn.exemplu.ro");
    expect(originOf("nu e url")).toBeNull();
    expect(originOf(undefined)).toBeNull();
  });

  it("sends HSTS only over HTTPS", () => {
    const keys = (https: boolean) => staticSecurityHeaders({ https }).map((h) => h.key);
    expect(keys(true)).toContain("Strict-Transport-Security");
    expect(keys(false)).not.toContain("Strict-Transport-Security");
    expect(keys(false)).toContain("X-Content-Type-Options");
  });
});
