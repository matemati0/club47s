import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  TWO_FACTOR_COOKIE_NAME,
  createAuthToken,
  getAuthCookieOptions
} from "@/lib/auth";
import {
  getTwoFactorChallengeMeta,
  verifyAndConsumeTwoFactorChallenge
} from "@/lib/security/twoFactorChallenges";
import {
  getLoginBlockState,
  getLoginRateLimitKey,
  registerFailedLoginAttempt,
  clearFailedLoginAttempts
} from "@/lib/security/loginRateLimit";
import { twoFactorVerifySchema } from "@/lib/validation/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  const challengeId = request.cookies.get(TWO_FACTOR_COOKIE_NAME)?.value;
  const meta = challengeId ? getTwoFactorChallengeMeta(challengeId) : null;
  const rateLimitKey = getTwoFactorRateLimitKey(request, meta?.email);

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

  if (!challengeId || !meta) {
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

  const verification = verifyAndConsumeTwoFactorChallenge(challengeId, parsed.data.code);
  if (!verification.ok) {
    const failureState = registerFailedLoginAttempt(rateLimitKey);
    await applyDelay(failureState.delayMs);

    const nextBlockedState = getLoginBlockState(rateLimitKey);
    if (nextBlockedState.blocked) {
      return jsonRateLimitResponse(nextBlockedState.retryAfterSeconds);
    }

    return NextResponse.json(
      {
        message:
          verification.reason === "expired"
            ? "קוד האימות פג תוקף. נסה להתחבר מחדש."
            : "קוד האימות אינו נכון"
      },
      { status: 401 }
    );
  }

  clearFailedLoginAttempts(rateLimitKey);
  const resolvedMode = verification.targetMode === "admin" ? "admin" : "member";
  const token = await createAuthToken(resolvedMode);

  const response = NextResponse.json({ mode: resolvedMode });
  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  response.cookies.set(TWO_FACTOR_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}
