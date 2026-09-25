/**
 * Creates the first administrator, or promotes an existing account.
 *
 *   ADMIN_EMAIL=ana@example.ro ADMIN_PASSWORD='…' pnpm admin:create
 *
 * Optional: ADMIN_FIRST_NAME, ADMIN_LAST_NAME. The email is marked verified.
 * Re-running with the same email only (re)grants the admin role and, if
 * ADMIN_PASSWORD is set, replaces the password.
 */
import "dotenv/config";

import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { emailSchema, passwordSchema } from "../src/validation/auth";

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  const email = emailSchema.safeParse(process.env.ADMIN_EMAIL ?? "");
  if (!email.success) throw new Error("Set ADMIN_EMAIL to a valid email address.");
  const rawPassword = process.env.ADMIN_PASSWORD;
  const password = rawPassword ? passwordSchema.safeParse(rawPassword) : null;
  if (password && !password.success)
    throw new Error(`ADMIN_PASSWORD: ${password.error.issues[0]?.message}`);

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    const admin = await db.role.upsert({
      where: { key: "admin" },
      create: { key: "admin", name: "Administrator", description: "Acces complet." },
      update: {},
    });
    const customer = await db.role.upsert({
      where: { key: "customer" },
      create: { key: "customer", name: "Client" },
      update: {},
    });
    const passwordHash = password?.success
      ? await hash(password.data, { memoryCost: 19_456, timeCost: 2, parallelism: 1 })
      : null;

    let user = await db.user.findUnique({ where: { email: email.data } });
    if (!user) {
      if (!passwordHash)
        throw new Error("ADMIN_PASSWORD is required to create a new admin account.");
      user = await db.user.create({
        data: {
          email: email.data,
          firstName: process.env.ADMIN_FIRST_NAME?.trim() || "Administrator",
          lastName: process.env.ADMIN_LAST_NAME?.trim() || "Alchimia",
          emailVerifiedAt: new Date(),
          roles: { create: [{ roleId: customer.id }] },
        },
      });
      console.log(`Created account ${email.data}.`);
    } else if (!user.emailVerifiedAt) {
      await db.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
    }

    if (passwordHash) {
      await db.account.deleteMany({ where: { userId: user.id, providerId: "credential" } });
      await db.account.create({
        data: {
          userId: user.id,
          providerId: "credential",
          accountId: email.data,
          password: passwordHash,
        },
      });
      await db.session.deleteMany({ where: { userId: user.id } });
    }
    await db.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: admin.id } },
      create: { userId: user.id, roleId: admin.id },
      update: {},
    });
    console.log(`${email.data} is now an administrator.`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
