import { NextResponse, type NextRequest } from "next/server";

/**
 * Optimistic redirect for protected areas: without a session cookie, send the
 * visitor to login and remember the exact page. This is only a convenience —
 * the real checks (session validity, roles) run on the server in layouts,
 * pages and every action.
 */
const PUBLIC_ACCOUNT_PATHS = [
  "/cont/autentificare",
  "/cont/inregistrare",
  "/cont/resetare-parola",
  "/cont/verificare-email",
];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_ACCOUNT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)))
    return NextResponse.next();
  if (request.cookies.has("ar_session")) return NextResponse.next();

  const login = new URL("/cont/autentificare", request.url);
  login.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/cont/:path*",
    "/cont",
    "/admin/:path*",
    "/admin",
    "/finalizare-comanda/:path*",
    "/finalizare-comanda",
  ],
};
