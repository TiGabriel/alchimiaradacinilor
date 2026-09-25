import { createHash, randomBytes } from "node:crypto";

/** 256-bit random token, URL-safe. Only its hash is ever stored. */
export function generateToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Pseudonymous IP for consent records (salted, truncated). */
export function hashIp(ip: string | null, salt: string): string | null {
  if (!ip) return null;
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
