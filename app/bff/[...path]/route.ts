/**
 * BFF (backend-for-frontend) proxy.
 *
 * Every browser API call goes to /bff/<path>, which this handler forwards to the
 * Django API at <API_BASE>/api/<path>, attaching the access token from the
 * httpOnly cookie. On a 401 it transparently refreshes the token once (via
 * /api/auth/refresh/), retries the original request, and re-issues the access
 * cookie. If refresh fails, it clears the cookies and returns 401 so the client
 * redirects to /login.
 *
 * This keeps JWTs out of client JavaScript entirely — the browser only ever
 * holds httpOnly cookies it cannot read.
 */
import { NextRequest, NextResponse } from "next/server";

import {
  API_BASE,
  clearTokenCookies,
  readTokens,
  setAccessCookie,
} from "@/lib/server/tokens";

export const dynamic = "force-dynamic";

const METHODS_WITH_BODY = new Set(["POST", "PUT", "PATCH", "DELETE"]);

async function refreshAccess(refresh: string): Promise<string | null> {
  const res = await fetch(`${API_BASE}/api/auth/refresh/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access?: string };
  return data.access ?? null;
}

async function forward(
  req: NextRequest,
  targetUrl: string,
  access: string | undefined,
  body: string | undefined,
): Promise<Response> {
  const headers: Record<string, string> = {};
  const contentType = req.headers.get("content-type");
  if (contentType) headers["Content-Type"] = contentType;
  if (access) headers["Authorization"] = `Bearer ${access}`;

  return fetch(targetUrl, {
    method: req.method,
    headers,
    body,
    // Never let fetch follow redirects transparently — surface them.
    redirect: "manual",
  });
}

async function handle(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await ctx.params;
  const search = req.nextUrl.search;
  const targetUrl = `${API_BASE}/api/${path.join("/")}/${search}`;

  const { access, refresh } = await readTokens();

  // Read the request body once (needed for a potential retry).
  let body: string | undefined;
  if (METHODS_WITH_BODY.has(req.method)) {
    body = await req.text();
  }

  let upstream = await forward(req, targetUrl, access, body);
  let newAccess: string | null = null;

  // Transparent single refresh on 401.
  if (upstream.status === 401 && refresh) {
    newAccess = await refreshAccess(refresh);
    if (newAccess) {
      upstream = await forward(req, targetUrl, newAccess, body);
    } else {
      // Refresh failed — clear the session.
      const res = new NextResponse(
        JSON.stringify({ detail: "Session expired.", code: "session_expired" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
      clearTokenCookies(res);
      return res;
    }
  }

  // Stream the upstream body through, preserving status & content type.
  const payload = await upstream.text();
  const res = new NextResponse(payload, {
    status: upstream.status,
    headers: {
      "Content-Type":
        upstream.headers.get("content-type") ?? "application/json",
    },
  });

  // If we minted a fresh access token, persist it.
  if (newAccess) setAccessCookie(res, newAccess);

  // A 401 that survived refresh (or had no refresh token) ends the session.
  if (upstream.status === 401) clearTokenCookies(res);

  return res;
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
