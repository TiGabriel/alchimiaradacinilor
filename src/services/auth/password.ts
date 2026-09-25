import { hash, verify } from "@node-rs/argon2";

/**
 * argon2id with the OWASP-recommended baseline (19 MiB, 2 iterations, 1 lane).
 * @node-rs/argon2 defaults to argon2id.
 */
const OPTIONS = { memoryCost: 19_456, timeCost: 2, parallelism: 1 } as const;

export function hashPassword(password: string): Promise<string> {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string, password: string): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

/**
 * Verified against when an account does not exist, so a failed login takes
 * about the same time whether or not the email is registered.
 */
let dummyHash: Promise<string> | null = null;
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hashPassword("dummy-password-for-timing-equalisation");
  await verifyPassword(await dummyHash, password);
  return false;
}
