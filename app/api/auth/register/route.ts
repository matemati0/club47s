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
import { hashMemberPasswordForStorage } from "@/lib/auth/memberAccounts";
import { sendTwoFactorCodeEmail } from "@/lib/notifications/twoFactorEmail";
import { ensureTrustedMutationOrigin } from "@/lib/security/requestOrigin";
import { createTwoFactorChallenge } from "@/lib/security/twoFactorChallenges";
import { registerSchema } from "@/lib/validation/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const originRejection = ensureTrustedMutationOrigin(request);
  if (originRejection) {
    return originRejection;
  }

  const body = (await request.json().catch(() => null)) as
    | { email?: string; password?: string; confirmPassword?: string }
    | null;

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    return NextResponse.json(
      {
        message: "יש לתקן את פרטי ההרשמה",
        errors: {
          email: fieldErrors.email,
          password: fieldErrors.password,
          confirmPassword: fieldErrors.confirmPassword
        }
      },
      { status: 400 }
    );
  }

  const registrationPasswordHash = await hashMemberPasswordForStorage(parsed.data.password);

  const code = generateTwoFactorCode();
  const expiresAt = Date.now() + TWO_FACTOR_COOKIE_MAX_AGE * 1000;
  const emailDelivery = await sendTwoFactorCodeEmail({
    to: parsed.data.email,
    code,
    purpose: "register"
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
    registrationPasswordHash,
    expiresAt,
    targetMode: "member"
  });

  const response = NextResponse.json({
    requiresTwoFactor: true,
    maskedEmail: maskEmail(parsed.data.email),
    message: emailDelivery.sent
      ? "קוד אימות נשלח לאימייל כדי לאשר את ההרשמה"
      : debugCode
        ? `שליחת המייל לא זמינה כרגע. ניתן להשתמש בקוד הבדיקה.${emailFailureReasonSuffix}`
        : `שליחת המייל לא זמינה כרגע. נסה שוב בעוד מספר דקות.${emailFailureReasonSuffix}`,
    debugCode
  });
  response.cookies.set(TWO_FACTOR_COOKIE_NAME, challenge.id, getTwoFactorCookieOptions());
  response.cookies.set(AUTH_COOKIE_NAME, "", { path: "/", maxAge: 0 });

  return response;
}
