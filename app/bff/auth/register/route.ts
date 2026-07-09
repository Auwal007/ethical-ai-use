/**
 * Registration proxy. Forwards to Django /api/auth/register/, stores the JWT
 * pair in httpOnly cookies, and returns only the user object to the client.
 */
import { NextRequest, NextResponse } from "next/server";

import { API_BASE, setTokenCookies } from "@/lib/server/tokens";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const body = await req.text();
  const upstream = await fetch(`${API_BASE}/api/auth/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const data = (await upstream.json()) as {
    access?: string;
    refresh?: string;
    user?: unknown;
    detail?: string;
    [key: string]: unknown;
  };

  if (!upstream.ok || !data.access || !data.refresh) {
    // Surface DRF field errors (e.g. consent_agreed, email) verbatim.
    return NextResponse.json(data, { status: upstream.status || 400 });
  }

  const res = NextResponse.json({ user: data.user });
  setTokenCookies(res, { access: data.access, refresh: data.refresh });
  return res;
}
