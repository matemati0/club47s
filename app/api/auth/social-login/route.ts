import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  TWO_FACTOR_COOKIE_NAME,
  getAuthCookieOptions
} from "@/lib/auth";
import { socialLoginSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { provider?: string }
    | null;
  const parsed = socialLoginSchema.safeParse(body);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json(
      {
        message: "יש לבחור ספק התחברות תקין",
        errors: {
          provider: fieldErrors.provider
        }
      },
      { status: 400 }
    );
  }

  const response = NextResponse.json({
    mode: "member" as const,
    provider: parsed.data.provider
  });
  response.cookies.set(AUTH_COOKIE_NAME, "member", getAuthCookieOptions());
  response.cookies.set(TWO_FACTOR_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}
