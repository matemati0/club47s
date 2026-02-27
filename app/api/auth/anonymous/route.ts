import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, createAuthToken, getAuthCookieOptions } from "@/lib/auth";
import { ensureTrustedMutationOrigin } from "@/lib/security/requestOrigin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const originRejection = ensureTrustedMutationOrigin(request);
  if (originRejection) {
    return originRejection;
  }

  const response = NextResponse.json({ mode: "anonymous" as const });
  const token = await createAuthToken("anonymous");
  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  return response;
}
