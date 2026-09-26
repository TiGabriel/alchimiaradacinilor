import { STORAGE_KEY_PATTERN } from "@/lib/images";
import { readLocalObject } from "@/lib/storage/local";

const TYPES: Record<string, string> = {
  webp: "image/webp",
  jpg: "image/jpeg",
  png: "image/png",
  avif: "image/avif",
};

/** Serves files of the local storage driver (keys are validated; no directory traversal). */
export async function GET(_request: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const key = (await ctx.params).key.join("/");
  if (!STORAGE_KEY_PATTERN.test(key)) return new Response("Not found", { status: 404 });
  const body = await readLocalObject(key);
  if (!body) return new Response("Not found", { status: 404 });
  return new Response(body as BodyInit, {
    headers: {
      "Content-Type": TYPES[key.split(".").pop()!] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      // Opened directly, a file can never run anything.
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
