/**
 * Login proxy. Forwards credentials to Django /api/auth/login/, then stores the
 * returned JWT pair in httpOnly cookies and returns ONLY the user object to the
 * client — the tokens themselves never reach client JavaScript.
 */
import { NextRequest, NextResponse } from "next/server";

import { API_BASE, setTokenCookies } from "@/lib/server/tokens";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text();
  const upstream = await fetch(`${API_BASE}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const data = (await upstream.json()) as {
    access?: string;
    refresh?: string;
    user?: unknown;
    detail?: string;
  };

  if (!upstream.ok || !data.access || !data.refresh) {
    return NextResponse.json(
      { detail: data.detail ?? "Login failed." },
      { status: upstream.status || 400 },
    );
  }

  const res = NextResponse.json({ user: data.user });
  setTokenCookies(res, { access: data.access, refresh: data.refresh });
  return res;
}
