import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, createAuthToken, getAuthCookieOptions } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({ mode: "anonymous" as const });
  const token = await createAuthToken("anonymous");
  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  return response;
}
