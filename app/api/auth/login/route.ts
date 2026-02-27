import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  TWO_FACTOR_COOKIE_MAX_AGE,
  TWO_FACTOR_COOKIE_NAME,
  generateTwoFactorCode,
  getTwoFactorCookieOptions,
  maskEmail,
  shouldExposeDebugTwoFactorCode
} from "@/lib/auth";
import { isValidMemberCredentialsAgainstStore } from "@/lib/auth/memberAccounts";
import { sendTwoFactorCodeEmail } from "@/lib/notifications/twoFactorEmail";
import { createTwoFactorChallenge } from "@/lib/security/twoFactorChallenges";
import {
  clearFailedLoginAttempts,
  getLoginBlockState,
  getLoginRateLimitKey,
  registerFailedLoginAttempt
} from "@/lib/security/loginRateLimit";
import { ensureTrustedMutationOrigin } from "@/lib/security/requestOrigin";
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
  const originRejection = ensureTrustedMutationOrigin(request);
  if (originRejection) {
    return originRejection;
  }

  const rateLimitKey = getLoginRateLimitKey(request);
  const blockedState = await getLoginBlockState(rateLimitKey);
  if (blockedState.blocked) {
    return jsonRateLimitResponse(blockedState.retryAfterSeconds);
  }

  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    const failureState = await registerFailedLoginAttempt(rateLimitKey);
    await applyDelay(failureState.delayMs);

    const nextBlockedState = await getLoginBlockState(rateLimitKey);
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

  const memberCredentialsValid = await isValidMemberCredentialsAgainstStore(
    parsed.data.email,
    parsed.data.password
  );

  if (!memberCredentialsValid) {
    const failureState = await registerFailedLoginAttempt(rateLimitKey);
    await applyDelay(failureState.delayMs);

    const nextBlockedState = await getLoginBlockState(rateLimitKey);
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

  await clearFailedLoginAttempts(rateLimitKey);

  const code = generateTwoFactorCode();
  const expiresAt = Date.now() + TWO_FACTOR_COOKIE_MAX_AGE * 1000;
  const emailDelivery = await sendTwoFactorCodeEmail({
    to: parsed.data.email,
    code,
    purpose: "login"
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

  const challenge = await createTwoFactorChallenge({
    email: parsed.data.email,
    code,
    expiresAt,
    targetMode: "member"
  });

  const response = NextResponse.json({
    requiresTwoFactor: true,
    maskedEmail: maskEmail(parsed.data.email),
    message: emailDelivery.sent
      ? "קוד אימות נשלח לכתובת האימייל שלך"
      : debugCode
        ? `שליחת המייל לא זמינה כרגע. ניתן להשתמש בקוד הבדיקה.${emailFailureReasonSuffix}`
        : `שליחת המייל לא זמינה כרגע. נסה שוב בעוד מספר דקות.${emailFailureReasonSuffix}`,
    debugCode
  });

  response.cookies.set(TWO_FACTOR_COOKIE_NAME, challenge.id, getTwoFactorCookieOptions());
  response.cookies.set(AUTH_COOKIE_NAME, "", { path: "/", maxAge: 0 });

  return response;
}
