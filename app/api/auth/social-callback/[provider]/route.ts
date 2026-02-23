import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  TWO_FACTOR_COOKIE_NAME,
  createAuthToken,
  getAuthCookieOptions,
  isSupportedSocialProvider
} from "@/lib/auth";
import {
  SOCIAL_OAUTH_STATE_COOKIE_NAME,
  decodeOAuthStatePayload,
  exchangeSocialCodeForProfile,
  getSocialOAuthStateCookieOptions,
  isSocialProviderConfigured
} from "@/lib/security/socialOAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATE_MAX_AGE_MS = 10 * 60 * 1000;

function buildLoginRedirectUrl(request: NextRequest, socialError?: string) {
  const url = new URL("/login", request.url);
  if (socialError) {
    url.searchParams.set("socialError", socialError);
  }
  return url;
}

function redirectToLogin(request: NextRequest, socialError: string) {
  const response = NextResponse.redirect(buildLoginRedirectUrl(request, socialError));
  response.cookies.set(SOCIAL_OAUTH_STATE_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0
  });
  response.cookies.set(TWO_FACTOR_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0
  });
  return response;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { provider: string } }
) {
  const providerParam = params.provider.trim().toLowerCase();
  if (!isSupportedSocialProvider(providerParam)) {
    return redirectToLogin(request, "unsupported_provider");
  }

  if (!isSocialProviderConfigured(providerParam)) {
    return redirectToLogin(request, "provider_not_configured");
  }

  const state = request.nextUrl.searchParams.get("state")?.trim();
  const code = request.nextUrl.searchParams.get("code")?.trim();
  const providerError = request.nextUrl.searchParams.get("error");
  if (providerError) {
    return redirectToLogin(request, "oauth_denied");
  }

  if (!state || !code) {
    return redirectToLogin(request, "missing_oauth_code");
  }

  const oauthState = decodeOAuthStatePayload(
    request.cookies.get(SOCIAL_OAUTH_STATE_COOKIE_NAME)?.value
  );
  if (!oauthState) {
    return redirectToLogin(request, "missing_oauth_state");
  }

  if (Date.now() - oauthState.createdAt > STATE_MAX_AGE_MS) {
    return redirectToLogin(request, "expired_oauth_state");
  }

  if (oauthState.provider !== providerParam || oauthState.state !== state) {
    return redirectToLogin(request, "invalid_oauth_state");
  }

  const profile = await exchangeSocialCodeForProfile(request, providerParam, code);
  if (!profile || !profile.email) {
    return redirectToLogin(request, "oauth_exchange_failed");
  }

  const redirectTo = new URL(oauthState.returnTo || "/club", request.url);
  const response = NextResponse.redirect(redirectTo);
  const token = await createAuthToken("member");

  response.cookies.set(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  response.cookies.set(TWO_FACTOR_COOKIE_NAME, "", { path: "/", maxAge: 0 });
  response.cookies.set(SOCIAL_OAUTH_STATE_COOKIE_NAME, "", {
    ...getSocialOAuthStateCookieOptions(),
    maxAge: 0
  });

  return response;
}
