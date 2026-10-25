import { describe, expect, it } from "vitest";

import { parseServerEnv } from "./env";

describe("parseServerEnv", () => {
  it("applies defaults", () => {
    const env = parseServerEnv({ DATABASE_URL: "postgresql://u:p@localhost:5432/db" });
    expect(env.EMAIL_PROVIDER).toBe("console");
    expect(env.STORAGE_DRIVER).toBe("local");
    expect(env.APP_URL).toBe("http://localhost:3000");
  });

  it("accepts the Netlify Blobs storage driver", () => {
    const env = parseServerEnv({
      DATABASE_URL: "postgresql://u:p@localhost:5432/db",
      STORAGE_DRIVER: "netlify",
    });
    expect(env.STORAGE_DRIVER).toBe("netlify");
  });

  it("treats empty integration variables as unset", () => {
    const env = parseServerEnv({
      DATABASE_URL: "postgresql://u:p@localhost:5432/db",
      BREVO_LIST_ID: "",
      BREVO_WEBHOOK_SECRET: "",
      BREVO_SENDER_EMAIL: "",
    });
    expect(env.BREVO_LIST_ID).toBeUndefined();
    expect(env.BREVO_SENDER_EMAIL).toBeUndefined();
    expect(
      parseServerEnv({ DATABASE_URL: env.DATABASE_URL, BREVO_LIST_ID: "12" }).BREVO_LIST_ID,
    ).toBe(12);
    expect(() =>
      parseServerEnv({ DATABASE_URL: env.DATABASE_URL, BREVO_SENDER_EMAIL: "nu-e-email" }),
    ).toThrow(/BREVO_SENDER_EMAIL/);
  });

  it("requires AUTH_SECRET in production", () => {
    expect(() =>
      parseServerEnv({
        DATABASE_URL: "postgresql://u:p@localhost:5432/db",
        NODE_ENV: "production",
      }),
    ).toThrow(/AUTH_SECRET/);
  });

  it("reports every invalid variable", () => {
    expect(() => parseServerEnv({ DATABASE_URL: "nope", EMAIL_PROVIDER: "pigeon" })).toThrow(
      /DATABASE_URL[\s\S]*EMAIL_PROVIDER/,
    );
  });
});
