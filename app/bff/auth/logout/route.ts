/** Logout: clears the token cookies. No upstream call needed (JWT is stateless). */
import { NextResponse } from "next/server";

import { clearTokenCookies } from "@/lib/server/tokens";

export const dynamic = "force-dynamic";

export async function POST(): Promise<NextResponse> {
  const res = NextResponse.json({ detail: "Logged out." });
  clearTokenCookies(res);
  return res;
}
