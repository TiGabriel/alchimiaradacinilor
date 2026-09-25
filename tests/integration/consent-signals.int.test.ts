import { describe, expect, it } from "vitest";

import { makeChoice, serializeChoice } from "@/lib/consent/cookie-choice";
import { db } from "@/lib/db";
import { recordAnalyticsEvent } from "@/services/analytics/record";
import { recordCookieChoice, setPersonalizationConsent } from "@/services/consent/consent";
import { loadPersonalContext } from "@/services/recommendation";
import { recordProductView } from "@/services/recommendation/signals";
import { settingDefaults } from "@/validation/settings";

import { makeProduct, makeVerifiedUser, meta } from "./helpers";

const version = settingDefaults.legal.cookiePolicyVersion;
const ids = { id: "choice_12345", aid: "analytics_1234" };
const event = {
  name: "product_view",
  anonymousId: ids.aid,
  path: "/produs/x",
  props: { slug: "x" },
};

describe("analytics consent gate (server)", () => {
  it("stores events only with analytics consent under the current policy", async () => {
    const accepted = serializeChoice(
      makeChoice({ analytics: true, marketing: false }, version, ids),
    );
    const refused = serializeChoice(
      makeChoice({ analytics: false, marketing: false }, version, ids),
    );
    const outdated = serializeChoice(makeChoice({ analytics: true, marketing: false }, "old", ids));

    expect(await recordAnalyticsEvent(event, undefined)).toBe("ignored");
    expect(await recordAnalyticsEvent(event, refused)).toBe("ignored");
    expect(await recordAnalyticsEvent(event, outdated)).toBe("ignored");
    expect(await recordAnalyticsEvent({ ...event, anonymousId: "someone_else1" }, accepted)).toBe(
      "ignored",
    );
    expect(await recordAnalyticsEvent({ ...event, name: "keylogger" }, accepted)).toBe("invalid");
    expect(await db.analyticsEvent.count()).toBe(0);

    expect(await recordAnalyticsEvent(event, accepted)).toBe("stored");
    const [stored] = await db.analyticsEvent.findMany();
    expect(stored).toMatchObject({ name: "product_view", anonymousId: ids.aid, path: "/produs/x" });
  });

  it("records each cookie choice as consent evidence", async () => {
    await recordCookieChoice(
      { id: ids.id, analytics: true, marketing: false, policyVersion: version },
      null,
      meta,
    );
    const records = await db.consentRecord.findMany({ where: { anonymousId: ids.id } });
    expect(records.map((r) => [r.purpose, r.granted, r.policyVersion]).sort()).toEqual([
      ["ANALYTICS", true, version],
      ["MARKETING", false, version],
    ]);
  });
});

describe("personalisation signals", () => {
  it("keeps viewed products only with consent and forgets them on withdrawal", async () => {
    const user = await makeVerifiedUser();
    const product = await makeProduct();
    await recordProductView(user.id, product.id);
    expect(await db.productView.count()).toBe(0);

    await setPersonalizationConsent(user.id, true, meta);
    await recordProductView(user.id, product.id);
    expect((await loadPersonalContext(user.id))?.viewedIds).toEqual([product.id]);

    await setPersonalizationConsent(user.id, false, meta);
    expect(await db.productView.count()).toBe(0);
    expect(await loadPersonalContext(user.id)).toBeUndefined();
  });
});
