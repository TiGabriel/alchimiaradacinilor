import { describe, expect, it } from "vitest";

import { campaignSchema } from "./newsletter";

const base = { subject: "Cinci arome", heading: "Cinci arome cu care să începi" };
const text = "Un text de cel puțin douăzeci de caractere.";
const designed = '<html><body>Salut <a href="{{ unsubscribe }}">dezabonare</a></body></html>';

describe("campaignSchema", () => {
  it("accepts a plain campaign without HTML", () => {
    expect(campaignSchema.parse({ ...base, body: text }).html).toBeNull();
  });

  it("needs the text when there is no designed HTML", () => {
    const result = campaignSchema.safeParse({ ...base, body: "scurt" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(["body"]);
  });

  it("makes the text optional for a designed campaign", () => {
    expect(campaignSchema.parse({ ...base, html: designed })).toMatchObject({
      body: "",
      html: designed,
    });
  });

  it("treats an empty HTML field as no design", () => {
    expect(campaignSchema.parse({ ...base, body: text, html: "  " }).html).toBeNull();
  });

  it("refuses designed HTML without the Brevo unsubscribe link", () => {
    const result = campaignSchema.safeParse({ ...base, html: "<html><body>Salut</body></html>" });
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((i) => i.path.join("."))).toContain("html");
  });
});
