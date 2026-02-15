import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, TWO_FACTOR_COOKIE_NAME } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ mode: "guest" as const });
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0
  });
  response.cookies.set(TWO_FACTOR_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0
  });
  return response;
}
