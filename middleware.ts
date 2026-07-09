/**
 * Route protection middleware — the real server-side gate.
 *
 * Any request to a protected route without a session cookie is redirected to
 * /login (preserving the intended destination). This runs before the page, so
 * it cannot be bypassed from the client. The per-page client guards remain as
 * UX niceties (spinners, friendly messages) but this is the enforcement point.
 *
 * The pre-test hard-gate (an authenticated student with no pre-test must land on
 * /pretest) requires the user's gating state, which lives behind the API; that
 * redirect is handled by the authenticated client guard (RequireAuth) to avoid
 * an API round-trip in middleware on every navigation.
 */
import { NextRequest, NextResponse } from "next/server";

import { REFRESH_COOKIE } from "@/lib/server/cookie-names";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/modules",
  "/pretest",
  "/posttest",
  "/usability",
  "/profile",
  "/certificate",
  "/admin",
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;

  if (!isProtected(pathname)) return NextResponse.next();

  // Presence of the (httpOnly) refresh cookie means there is a session the BFF
  // can keep alive. Absence means definitely logged out.
  const hasSession = Boolean(req.cookies.get(REFRESH_COOKIE)?.value);
  if (hasSession) return NextResponse.next();

  const loginUrl = new URL("/login", req.url);
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/modules/:path*",
    "/pretest/:path*",
    "/posttest/:path*",
    "/usability/:path*",
    "/profile/:path*",
    "/certificate/:path*",
    "/admin/:path*",
  ],
};
