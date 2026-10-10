import { describe, expect, it } from "vitest";

import { hasUnsubscribeTag, previewBrevoHtml } from "./brevo-html";

const html = `<p>Bună{% if contact.FIRSTNAME %}, {{ contact.FIRSTNAME }}{% endif %}!</p>
<a href="{{ mirror }}">Vezi online</a> · <a href="{{unsubscribe}}">Dezabonează-te</a>
<p>{{ contact.ORAS }}</p>`;

describe("hasUnsubscribeTag", () => {
  it("accepts the Brevo unsubscribe tag with or without spaces", () => {
    expect(hasUnsubscribeTag(html)).toBe(true);
    expect(hasUnsubscribeTag('<a href="{{ unsubscribe }}">x</a>')).toBe(true);
  });

  it("rejects HTML without it", () => {
    expect(hasUnsubscribeTag('<a href="https://exemplu.ro/dezabonare">x</a>')).toBe(false);
    expect(hasUnsubscribeTag("{{ mirror }}")).toBe(false);
  });
});

describe("previewBrevoHtml", () => {
  it("fills the first name, keeps conditional content and neutralises Brevo links", () => {
    const preview = previewBrevoHtml(html, { firstName: "Ana" });
    expect(preview).toContain("<p>Bună, Ana!</p>");
    expect(preview).toContain('<a href="#">Vezi online</a>');
    expect(preview).toContain('<a href="#">Dezabonează-te</a>');
    expect(preview).toContain("<p></p>");
    expect(preview).not.toMatch(/\{\{|\{%/);
  });
});
