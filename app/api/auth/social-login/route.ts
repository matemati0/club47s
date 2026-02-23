import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  TWO_FACTOR_COOKIE_NAME,
  type SocialProvider,
  createAuthToken,
  getAuthCookieOptions
} from "@/lib/auth";
import { socialLoginSchema } from "@/lib/validation/auth";
import {
  SOCIAL_OAUTH_STATE_COOKIE_NAME,
  buildSocialAuthorizeUrl,
  encodeOAuthStatePayload,
  generateSocialOAuthState,
  getSocialOAuthStateCookieOptions,
  isSocialProviderConfigured,
  sanitizeReturnTo
} from "@/lib/security/socialOAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SocialLoginBody = {
  provider?: string;
  returnTo?: string;
};

async function buildDevelopmentFallbackResponse(provider: SocialProvider) {
  const response = NextResponse.json({
    mode: "member" as const,
    provider,
    fallback: true as const
  });

  const token = await createAuthToken("member");
  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  response.cookies.set(TWO_FACTOR_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  response.cookies.set(SOCIAL_OAUTH_STATE_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as SocialLoginBody | null;
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

  const provider = parsed.data.provider as SocialProvider;
  const returnTo = sanitizeReturnTo(body?.returnTo);
  const allowMockSocialLogin = process.env.ALLOW_MOCK_SOCIAL_LOGIN === "true";

  if (!isSocialProviderConfigured(provider)) {
    if (process.env.NODE_ENV !== "production" || allowMockSocialLogin) {
      return buildDevelopmentFallbackResponse(provider);
    }

    return NextResponse.json(
      {
        message: "התחברות חברתית אינה מוגדרת כרגע במערכת. פנה לתמיכה.",
        errors: {
          provider: ["Missing OAuth provider credentials"]
        }
      },
      { status: 503 }
    );
  }

  const state = generateSocialOAuthState();
  const redirectUrl = buildSocialAuthorizeUrl(request, provider, state);
  if (!redirectUrl) {
    return NextResponse.json(
      {
        message: "לא ניתן להתחיל התחברות חברתית כרגע. נסה שוב בעוד רגע."
      },
      { status: 500 }
    );
  }

  const response = NextResponse.json({
    provider,
    redirectUrl
  });

  response.cookies.set(
    SOCIAL_OAUTH_STATE_COOKIE_NAME,
    encodeOAuthStatePayload({
      provider,
      state,
      returnTo,
      createdAt: Date.now()
    }),
    getSocialOAuthStateCookieOptions()
  );
  response.cookies.set(TWO_FACTOR_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  return response;
}
