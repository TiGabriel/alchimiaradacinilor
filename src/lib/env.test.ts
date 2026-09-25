import { describe, expect, it } from "vitest";

import { parseServerEnv } from "./env";

describe("parseServerEnv", () => {
  it("applies defaults", () => {
    const env = parseServerEnv({ DATABASE_URL: "postgresql://u:p@localhost:5432/db" });
    expect(env.EMAIL_PROVIDER).toBe("console");
    expect(env.STORAGE_DRIVER).toBe("local");
    expect(env.APP_URL).toBe("http://localhost:3000");
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
