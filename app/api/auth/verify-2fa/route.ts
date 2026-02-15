import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  TWO_FACTOR_COOKIE_NAME,
  getAuthCookieOptions,
  isExpiredTwoFactorChallenge,
  isValidTwoFactorCodeFormat,
  parseTwoFactorChallenge
} from "@/lib/auth";
import {
  getLoginBlockState,
  getLoginRateLimitKey,
  registerFailedLoginAttempt,
  clearFailedLoginAttempts
} from "@/lib/security/loginRateLimit";
import { twoFactorVerifySchema } from "@/lib/validation/auth";

function jsonRateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      message: "בוצעו יותר מדי ניסיונות אימות. נסה שוב מאוחר יותר."
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSeconds)
      }
    }
  );
}

async function applyDelay(delayMs: number) {
  await new Promise((resolve) => setTimeout(resolve, delayMs));
}

function getTwoFactorRateLimitKey(request: NextRequest, emailHint?: string) {
  const base = `${getLoginRateLimitKey(request)}:2fa`;
  if (!emailHint) {
    return base;
  }
  return `${base}:${emailHint.toLowerCase()}`;
}

export async function POST(request: NextRequest) {
  const challenge = parseTwoFactorChallenge(
    request.cookies.get(TWO_FACTOR_COOKIE_NAME)?.value
  );
  const rateLimitKey = getTwoFactorRateLimitKey(request, challenge?.email);

  const blockedState = getLoginBlockState(rateLimitKey);
  if (blockedState.blocked) {
    return jsonRateLimitResponse(blockedState.retryAfterSeconds);
  }

  const body = (await request.json().catch(() => null)) as { code?: string } | null;
  const parsed = twoFactorVerifySchema.safeParse(body);

  if (!parsed.success) {
    const failureState = registerFailedLoginAttempt(rateLimitKey);
    await applyDelay(failureState.delayMs);

    const nextBlockedState = getLoginBlockState(rateLimitKey);
    if (nextBlockedState.blocked) {
      return jsonRateLimitResponse(nextBlockedState.retryAfterSeconds);
    }

    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json(
      {
        message: "יש להזין קוד אימות תקין",
        errors: {
          code: fieldErrors.code
        }
      },
      { status: 400 }
    );
  }

  if (!challenge || isExpiredTwoFactorChallenge(challenge)) {
    const failureState = registerFailedLoginAttempt(rateLimitKey);
    await applyDelay(failureState.delayMs);

    const response = NextResponse.json(
      {
        message: "קוד האימות פג תוקף. נסה להתחבר מחדש."
      },
      { status: 401 }
    );
    response.cookies.set(TWO_FACTOR_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return response;
  }

  if (!isValidTwoFactorCodeFormat(challenge.code) || parsed.data.code !== challenge.code) {
    const failureState = registerFailedLoginAttempt(rateLimitKey);
    await applyDelay(failureState.delayMs);

    const nextBlockedState = getLoginBlockState(rateLimitKey);
    if (nextBlockedState.blocked) {
      return jsonRateLimitResponse(nextBlockedState.retryAfterSeconds);
    }

    return NextResponse.json(
      {
        message: "קוד האימות אינו נכון"
      },
      { status: 401 }
    );
  }

  clearFailedLoginAttempts(rateLimitKey);

  const resolvedMode = challenge.targetMode === "admin" ? "admin" : "member";

  const response = NextResponse.json({ mode: resolvedMode });
  response.cookies.set(AUTH_COOKIE_NAME, resolvedMode, getAuthCookieOptions());
  response.cookies.set(TWO_FACTOR_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}
