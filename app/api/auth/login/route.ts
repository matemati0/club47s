import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  REGISTERED_MEMBER_COOKIE_NAME,
  TWO_FACTOR_COOKIE_MAX_AGE,
  TWO_FACTOR_COOKIE_NAME,
  generateTwoFactorCode,
  getAuthCookieOptions,
  getTwoFactorCookieOptions,
  isValidMemberCredentials,
  maskEmail,
  parseRegisteredMemberCredentials,
  serializeTwoFactorChallenge,
  shouldExposeDebugTwoFactorCode
} from "@/lib/auth";
import { sendTwoFactorCodeEmail } from "@/lib/notifications/twoFactorEmail";
import {
  clearFailedLoginAttempts,
  getLoginBlockState,
  getLoginRateLimitKey,
  registerFailedLoginAttempt
} from "@/lib/security/loginRateLimit";
import { loginSchema } from "@/lib/validation/auth";

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
  const rateLimitKey = getLoginRateLimitKey(request);
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

  const registeredCredentials = parseRegisteredMemberCredentials(
    request.cookies.get(REGISTERED_MEMBER_COOKIE_NAME)?.value
  );

  if (
    !isValidMemberCredentials(
      parsed.data.email,
      parsed.data.password,
      registeredCredentials
    )
  ) {
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
  const challenge = serializeTwoFactorChallenge({
    email: parsed.data.email,
    code,
    expiresAt: Date.now() + TWO_FACTOR_COOKIE_MAX_AGE * 1000,
    targetMode: "member"
  });
  const emailDelivery = await sendTwoFactorCodeEmail({
    to: parsed.data.email,
    code,
    purpose: "login"
  });
  const debugCode = shouldExposeDebugTwoFactorCode() ? code : undefined;

  const response = NextResponse.json({
    requiresTwoFactor: true,
    maskedEmail: maskEmail(parsed.data.email),
    message: emailDelivery.sent
      ? "קוד אימות נשלח לכתובת האימייל שלך"
      : debugCode
        ? "שליחת המייל לא זמינה כרגע. ניתן להשתמש בקוד הבדיקה."
        : "שליחת המייל לא זמינה כרגע. נסה שוב בעוד מספר דקות.",
    debugCode: emailDelivery.sent ? undefined : debugCode
  });

  response.cookies.set(TWO_FACTOR_COOKIE_NAME, challenge, getTwoFactorCookieOptions());
  response.cookies.set(AUTH_COOKIE_NAME, "guest", getAuthCookieOptions());

  return response;
}
