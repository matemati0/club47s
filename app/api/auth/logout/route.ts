import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, TWO_FACTOR_COOKIE_NAME } from "@/lib/auth";
import { ensureTrustedMutationOrigin } from "@/lib/security/requestOrigin";

export async function POST(request: NextRequest) {
  const originRejection = ensureTrustedMutationOrigin(request);
  if (originRejection) {
    return originRejection;
  }

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
