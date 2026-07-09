/**
 * Server-only JWT cookie helpers.
 *
 * Tokens are stored in httpOnly cookies so they are never exposed to client
 * JavaScript (XSS-safe). All browser API calls go through the BFF proxy
 * (app/bff/[...path]/route.ts), which reads these cookies server-side and
 * attaches the Bearer header. The browser itself never sees a token.
 */
import "server-only";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/server/cookie-names";

export { ACCESS_COOKIE, REFRESH_COOKIE };

/** Django API base URL (server-side env, not exposed to the client bundle). */
export const API_BASE =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

const isProd = process.env.NODE_ENV === "production";

const baseCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: "lax" as const,
  path: "/",
};

/** Access token: short-lived (matches SimpleJWT ACCESS_TOKEN_LIFETIME = 12h). */
const ACCESS_MAX_AGE = 60 * 60 * 12;
/** Refresh token: 7 days (matches SimpleJWT REFRESH_TOKEN_LIFETIME). */
const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

/** Write both token cookies onto a NextResponse (used by login/register/refresh). */
export function setTokenCookies(
  res: NextResponse,
  tokens: { access: string; refresh: string },
): void {
  res.cookies.set(ACCESS_COOKIE, tokens.access, {
    ...baseCookieOptions,
    maxAge: ACCESS_MAX_AGE,
  });
  res.cookies.set(REFRESH_COOKIE, tokens.refresh, {
    ...baseCookieOptions,
    maxAge: REFRESH_MAX_AGE,
  });
}

/** Overwrite just the access cookie (after a silent refresh). */
export function setAccessCookie(res: NextResponse, access: string): void {
  res.cookies.set(ACCESS_COOKIE, access, {
    ...baseCookieOptions,
    maxAge: ACCESS_MAX_AGE,
  });
}

/** Delete both token cookies (logout / failed refresh). */
export function clearTokenCookies(res: NextResponse): void {
  res.cookies.set(ACCESS_COOKIE, "", { ...baseCookieOptions, maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { ...baseCookieOptions, maxAge: 0 });
}

/** Read tokens from the incoming request's cookies (async in Next 15). */
export async function readTokens(): Promise<{
  access: string | undefined;
  refresh: string | undefined;
}> {
  const store = await cookies();
  return {
    access: store.get(ACCESS_COOKIE)?.value,
    refresh: store.get(REFRESH_COOKIE)?.value,
  };
}
