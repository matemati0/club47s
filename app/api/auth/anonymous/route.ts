import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, getAuthCookieOptions } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ mode: "anonymous" as const });
  response.cookies.set(AUTH_COOKIE_NAME, "anonymous", getAuthCookieOptions());
  return response;
}
