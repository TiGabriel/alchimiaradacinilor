import { describe, expect, it } from "vitest";

import { parseServerEnv } from "../env";

import { resolveEmailProvider } from "./index";
import {
  contactMessageEmail,
  passwordResetEmail,
  verificationEmail,
  welcomeEmail,
} from "./templates/account";
import { escapeHtml, renderEmail } from "./templates/layout";

const brand = { siteName: "Alchimia Rădăcinilor", siteUrl: "https://example.ro" };
const base = { DATABASE_URL: "postgresql://u:p@localhost:5432/db" };

describe("resolveEmailProvider", () => {
  it("logs to the console in development", () => {
    const r = resolveEmailProvider(parseServerEnv({ ...base, NODE_ENV: "development" }));
    expect("provider" in r && r.provider.name).toBe("console");
  });

  it("refuses the console provider in production (sending disabled, not faked)", () => {
    const r = resolveEmailProvider(
      parseServerEnv({ ...base, NODE_ENV: "production", AUTH_SECRET: "x".repeat(32) }),
    );
    expect("disabled" in r).toBe(true);
  });

  it("disables half-configured providers", () => {
    expect(
      "disabled" in resolveEmailProvider(parseServerEnv({ ...base, EMAIL_PROVIDER: "resend" })),
    ).toBe(true);
    expect(
      "disabled" in
        resolveEmailProvider(
          parseServerEnv({ ...base, EMAIL_PROVIDER: "resend", RESEND_API_KEY: "k" }),
        ),
    ).toBe(true);
    const ok = resolveEmailProvider(
      parseServerEnv({
        ...base,
        EMAIL_PROVIDER: "resend",
        RESEND_API_KEY: "k",
        EMAIL_FROM: "A <a@b.ro>",
      }),
    );
    expect("provider" in ok && ok.provider.name).toBe("resend");
    expect(
      "disabled" in resolveEmailProvider(parseServerEnv({ ...base, EMAIL_PROVIDER: "smtp" })),
    ).toBe(true);
  });
});

describe("email templates", () => {
  it("escapes user-provided content", () => {
    expect(escapeHtml(`<script>"x"&'y'</script>`)).toBe(
      "&lt;script&gt;&quot;x&quot;&amp;&#39;y&#39;&lt;/script&gt;",
    );
    const email = contactMessageEmail(
      { name: "<b>Eve</b>", email: "e@x.ro", subject: null, message: "<img src=x>" },
      brand,
    );
    expect(email.html).not.toContain("<b>Eve</b>");
    expect(email.html).not.toContain("<img src=x>");
    expect(email.html).toContain("&lt;b&gt;Eve&lt;/b&gt;");
  });

  it("refuses non-http links in buttons", () => {
    const email = renderEmail(
      {
        subject: "s",
        preheader: "p",
        heading: "h",
        blocks: [{ type: "button", label: "x", href: "javascript:alert(1)" }],
      },
      brand,
    );
    expect(email.html).not.toContain("javascript:");
  });

  it("renders verification, welcome and reset emails with HTML and text versions", () => {
    const url = "https://example.ro/cont/verificare-email?token=abc";
    const verification = verificationEmail({ firstName: "Ana", url, hours: 24 }, brand);
    expect(verification.subject).toContain("Confirmă");
    expect(verification.html).toContain('lang="ro"');
    expect(verification.html).toContain(url);
    expect(verification.text).toContain(url);

    const welcome = welcomeEmail(
      {
        firstName: "Ana",
        shopUrl: "https://example.ro/produse",
        quizUrl: "https://example.ro/quiz",
      },
      brand,
    );
    expect(welcome.text).toContain("Mulțumim, Ana!");

    const reset = passwordResetEmail({ firstName: "Ana", url, minutes: 60 }, brand);
    expect(reset.html).toContain("60 de minute");
  });
});
