import { NextResponse, type NextRequest } from "next/server";

import { buildCsp, createNonce, originOf } from "@/lib/security-headers";

/**
 * Runs before every page:
 * 1. Content Security Policy with a fresh nonce (Next.js reads it from the
 *    request header and marks its scripts; every page renders dynamically).
 * 2. Optimistic redirect for protected areas: without a session cookie, send
 *    the visitor to login and remember the exact page. Only a convenience —
 *    the real checks (session validity, roles) run on the server in layouts,
 *    pages and every action.
 */
const PROTECTED_PREFIXES = ["/cont", "/admin", "/finalizare-comanda"];
const PUBLIC_ACCOUNT_PATHS = [
  "/cont/autentificare",
  "/cont/inregistrare",
  "/cont/resetare-parola",
  "/cont/verificare-email",
];

const under = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

function needsLogin(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!PROTECTED_PREFIXES.some((p) => under(pathname, p))) return false;
  if (PUBLIC_ACCOUNT_PATHS.some((p) => under(pathname, p))) return false;
  return !request.cookies.has("ar_session");
}

export function proxy(request: NextRequest) {
  const nonce = createNonce();
  const imageOrigin = originOf(
    process.env.STORAGE_DRIVER === "s3" ? process.env.S3_PUBLIC_URL : null,
  );
  const csp = buildCsp({
    nonce,
    dev: process.env.NODE_ENV === "development",
    imageOrigins: imageOrigin ? [imageOrigin] : [],
    upgradeInsecureRequests: (process.env.APP_URL ?? "").startsWith("https://"),
  });

  let response: NextResponse;
  if (needsLogin(request)) {
    const { pathname, search } = request.nextUrl;
    const login = new URL("/cont/autentificare", request.url);
    login.searchParams.set("next", `${pathname}${search}`);
    response = NextResponse.redirect(login);
  } else {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-nonce", nonce);
    requestHeaders.set("Content-Security-Policy", csp);
    response = NextResponse.next({ request: { headers: requestHeaders } });
  }
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [
    {
      // Pages only: not API routes, build assets, image optimisation, uploads or metadata files.
      source:
        "/((?!api/|_next/static|_next/image|uploads/|favicon.ico|icon.svg|apple-icon.png|og-default.png|robots.txt|sitemap.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
