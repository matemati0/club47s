import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  REGISTERED_MEMBER_COOKIE_NAME,
  TWO_FACTOR_COOKIE_MAX_AGE,
  TWO_FACTOR_COOKIE_NAME,
  generateTwoFactorCode,
  getAuthCookieOptions,
  getRegisteredMemberCookieOptions,
  getTwoFactorCookieOptions,
  maskEmail,
  serializeRegisteredMemberCredentials,
  serializeTwoFactorChallenge,
  shouldExposeDebugTwoFactorCode
} from "@/lib/auth";
import { sendTwoFactorCodeEmail } from "@/lib/notifications/twoFactorEmail";
import { registerSchema } from "@/lib/validation/auth";

export async function POST(request: NextRequest) {
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

  const encodedCredentials = serializeRegisteredMemberCredentials(
    parsed.data.email,
    parsed.data.password
  );

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
    purpose: "register"
  });
  const debugCode = shouldExposeDebugTwoFactorCode() ? code : undefined;

  const response = NextResponse.json({
    requiresTwoFactor: true,
    maskedEmail: maskEmail(parsed.data.email),
    message: emailDelivery.sent
      ? "קוד אימות נשלח לאימייל כדי לאשר את ההרשמה"
      : debugCode
        ? "שליחת המייל לא זמינה כרגע. ניתן להשתמש בקוד הבדיקה."
        : "שליחת המייל לא זמינה כרגע. נסה שוב בעוד מספר דקות.",
    debugCode: emailDelivery.sent ? undefined : debugCode
  });
  response.cookies.set(
    REGISTERED_MEMBER_COOKIE_NAME,
    encodedCredentials,
    getRegisteredMemberCookieOptions()
  );
  response.cookies.set(TWO_FACTOR_COOKIE_NAME, challenge, getTwoFactorCookieOptions());
  response.cookies.set(AUTH_COOKIE_NAME, "guest", getAuthCookieOptions());

  return response;
}
