import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  TWO_FACTOR_COOKIE_MAX_AGE,
  TWO_FACTOR_COOKIE_NAME,
  generateTwoFactorCode,
  getTwoFactorCookieOptions,
  isValidAdminCredentials,
  maskEmail,
  shouldExposeDebugTwoFactorCode
} from "@/lib/auth";
import { sendTwoFactorCodeEmail } from "@/lib/notifications/twoFactorEmail";
import { createTwoFactorChallenge } from "@/lib/security/twoFactorChallenges";
import {
  clearFailedLoginAttempts,
  getLoginBlockState,
  getLoginRateLimitKey,
  registerFailedLoginAttempt
} from "@/lib/security/loginRateLimit";
import { loginSchema } from "@/lib/validation/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function jsonRateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    {
      message: "בוצעו יותר מדי ניסיונות התחברות. נסה שוב מאוחר יותר."
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

export async function POST(request: NextRequest) {
  const rateLimitKey = `${getLoginRateLimitKey(request)}:admin`;
  const blockedState = getLoginBlockState(rateLimitKey);
  if (blockedState.blocked) {
    return jsonRateLimitResponse(blockedState.retryAfterSeconds);
  }

  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;
  const parsed = loginSchema.safeParse(body);

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
        message: "יש לתקן את פרטי ההתחברות",
        errors: {
          email: fieldErrors.email,
          password: fieldErrors.password
        }
      },
      { status: 400 }
    );
  }

  if (!isValidAdminCredentials(parsed.data.email, parsed.data.password)) {
    const failureState = registerFailedLoginAttempt(rateLimitKey);
    await applyDelay(failureState.delayMs);

    const nextBlockedState = getLoginBlockState(rateLimitKey);
    if (nextBlockedState.blocked) {
      return jsonRateLimitResponse(nextBlockedState.retryAfterSeconds);
    }

    return NextResponse.json(
      {
        message: "האימייל או הסיסמה אינם נכונים"
      },
      { status: 401 }
    );
  }

  clearFailedLoginAttempts(rateLimitKey);

  const code = generateTwoFactorCode();
  const expiresAt = Date.now() + TWO_FACTOR_COOKIE_MAX_AGE * 1000;
  const emailDelivery = await sendTwoFactorCodeEmail({
    to: parsed.data.email,
    code,
    purpose: "admin-login"
  });
  const debugCode = shouldExposeDebugTwoFactorCode() ? code : undefined;
  const emailFailureReasonSuffix =
    !emailDelivery.sent && process.env.NODE_ENV !== "production"
      ? ` (reason: ${emailDelivery.reason})`
      : "";

  if (!emailDelivery.sent && !debugCode) {
    const response = NextResponse.json(
      {
        message: `שליחת המייל לא זמינה כרגע. נסה שוב בעוד מספר דקות.${emailFailureReasonSuffix}`
      },
      { status: 503 }
    );
    response.cookies.set(TWO_FACTOR_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    response.cookies.set(AUTH_COOKIE_NAME, "", { path: "/", maxAge: 0 });
    return response;
  }

  const challenge = createTwoFactorChallenge({
    email: parsed.data.email,
    code,
    expiresAt,
    targetMode: "admin"
  });

  const response = NextResponse.json({
    requiresTwoFactor: true,
    maskedEmail: maskEmail(parsed.data.email),
    message: emailDelivery.sent
      ? "קוד אימות נשלח לאימייל המנהל"
      : debugCode
        ? `שליחת המייל לא זמינה כרגע. ניתן להשתמש בקוד הבדיקה.${emailFailureReasonSuffix}`
        : `שליחת המייל לא זמינה כרגע. נסה שוב בעוד מספר דקות.${emailFailureReasonSuffix}`,
    debugCode
  });

  response.cookies.set(TWO_FACTOR_COOKIE_NAME, challenge.id, getTwoFactorCookieOptions());
  response.cookies.set(AUTH_COOKIE_NAME, "", { path: "/", maxAge: 0 });

  return response;
}
