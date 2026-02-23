import crypto from "node:crypto";
import { NextRequest } from "next/server";
import type { SocialProvider } from "@/lib/auth";

export const SOCIAL_OAUTH_STATE_COOKIE_NAME = "club-social-oauth-state";
const SOCIAL_OAUTH_STATE_MAX_AGE = 60 * 10;

type OAuthStatePayload = {
  provider: SocialProvider;
  state: string;
  returnTo: string;
  createdAt: number;
};

export type SocialProfile = {
  provider: SocialProvider;
  providerUserId: string;
  email: string;
  displayName?: string;
};

type ProviderSecrets = {
  clientId: string;
  clientSecret: string;
};

type TokenResponse = {
  access_token?: string;
};

type GoogleUserInfo = {
  sub?: string;
  email?: string;
  name?: string;
};

function readFirstEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return "";
}

function resolveGoogleProviderSecrets(): ProviderSecrets {
  return {
    clientId: readFirstEnv("GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_CLIENT_ID"),
    clientSecret: readFirstEnv("GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET")
  };
}

export function isSocialProviderConfigured(provider: SocialProvider) {
  if (provider !== "google") {
    return false;
  }

  const { clientId, clientSecret } = resolveGoogleProviderSecrets();
  return Boolean(clientId && clientSecret);
}

export function getSocialOAuthStateCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SOCIAL_OAUTH_STATE_MAX_AGE
  };
}

export function generateSocialOAuthState() {
  return crypto.randomBytes(24).toString("hex");
}

export function sanitizeReturnTo(value?: string) {
  if (!value) {
    return "/";
  }

  const normalized = value.trim();
  if (!normalized.startsWith("/") || normalized.startsWith("//")) {
    return "/";
  }

  return normalized;
}

function normalizeBaseUrl(raw: string) {
  try {
    const url = new URL(raw.trim());
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

function resolveRequestOrigin(request: NextRequest) {
  const configured = normalizeBaseUrl(readFirstEnv("OAUTH_BASE_URL", "NEXT_PUBLIC_SITE_URL"));
  if (configured) {
    return configured;
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return request.nextUrl.origin;
}

export function buildSocialCallbackUrl(request: NextRequest, provider: SocialProvider) {
  return `${resolveRequestOrigin(request)}/api/auth/social-callback/${provider}`;
}

export function buildSocialAuthorizeUrl(
  request: NextRequest,
  provider: SocialProvider,
  state: string
) {
  if (provider !== "google") {
    return null;
  }

  const secrets = resolveGoogleProviderSecrets();
  if (!secrets.clientId || !secrets.clientSecret) {
    return null;
  }

  const redirectUri = buildSocialCallbackUrl(request, provider);
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", secrets.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export function encodeOAuthStatePayload(payload: OAuthStatePayload) {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeOAuthStatePayload(value?: string | null): OAuthStatePayload | null {
  if (!value) {
    return null;
  }

  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as Partial<OAuthStatePayload> | null;
    if (!parsed) {
      return null;
    }

    if (
      parsed.provider !== "google" ||
      typeof parsed.state !== "string" ||
      typeof parsed.returnTo !== "string" ||
      typeof parsed.createdAt !== "number"
    ) {
      return null;
    }

    return {
      provider: parsed.provider,
      state: parsed.state,
      returnTo: sanitizeReturnTo(parsed.returnTo),
      createdAt: parsed.createdAt
    };
  } catch {
    return null;
  }
}

export async function exchangeSocialCodeForProfile(
  request: NextRequest,
  provider: SocialProvider,
  code: string
): Promise<SocialProfile | null> {
  if (provider !== "google") {
    return null;
  }

  const secrets = resolveGoogleProviderSecrets();
  if (!secrets.clientId || !secrets.clientSecret) {
    return null;
  }

  const redirectUri = buildSocialCallbackUrl(request, provider);
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      code,
      client_id: secrets.clientId,
      client_secret: secrets.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    }),
    cache: "no-store"
  });

  if (!tokenResponse.ok) {
    return null;
  }

  const tokenPayload = (await tokenResponse.json().catch(() => null)) as TokenResponse | null;
  const accessToken = tokenPayload?.access_token;
  if (!accessToken) {
    return null;
  }

  const userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    cache: "no-store"
  });

  if (!userInfoResponse.ok) {
    return null;
  }

  const userInfo = (await userInfoResponse.json().catch(() => null)) as GoogleUserInfo | null;
  const email = userInfo?.email?.trim().toLowerCase();
  const providerUserId = userInfo?.sub?.trim();
  if (!email || !providerUserId) {
    return null;
  }

  return {
    provider,
    providerUserId,
    email,
    displayName: userInfo?.name?.trim() || undefined
  };
}
