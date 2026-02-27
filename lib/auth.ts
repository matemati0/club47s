import { signJson, verifyJson } from "@/lib/security/signedToken";

export type AuthMode = "guest" | "anonymous" | "member" | "admin";
export type SocialProvider = "google";
export type TwoFactorTargetMode = "member" | "admin";

export const AUTH_COOKIE_NAME = "club-auth-mode";
export const TWO_FACTOR_COOKIE_NAME = "club-two-factor";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const TWO_FACTOR_COOKIE_MAX_AGE = 60 * 10;

let didWarnMissingAdminCredentials = false;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

type SessionMode = Exclude<AuthMode, "guest">;
type AuthTokenPayload = {
  v: 1;
  mode: SessionMode;
  iat: number;
  exp: number;
};

function resolveAuthCookieSecret() {
  const configured = process.env.AUTH_COOKIE_SECRET?.trim();
  if (configured) {
    return configured;
  }

  if (process.env.NODE_ENV !== "production") {
    return "dev-only-secret-change-me";
  }

  return "";
}

export async function createAuthToken(mode: SessionMode) {
  const secret = resolveAuthCookieSecret();
  if (!secret) {
    throw new Error("Missing AUTH_COOKIE_SECRET");
  }

  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + AUTH_COOKIE_MAX_AGE;

  return signJson<AuthTokenPayload>(
    {
      v: 1,
      mode,
      iat,
      exp
    },
    secret
  );
}

export async function resolveAuthMode(value?: string | null): Promise<AuthMode> {
  if (!value) {
    return "guest";
  }

  const secret = resolveAuthCookieSecret();
  if (!secret) {
    return "guest";
  }

  const payload = await verifyJson<AuthTokenPayload>(value, secret);
  if (!payload || payload.v !== 1) {
    return "guest";
  }

  if (
    typeof payload.exp !== "number" ||
    !Number.isFinite(payload.exp) ||
    payload.exp <= Math.floor(Date.now() / 1000)
  ) {
    return "guest";
  }

  if (payload.mode === "member" || payload.mode === "anonymous" || payload.mode === "admin") {
    return payload.mode;
  }

  return "guest";
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE
  };
}

export function getTwoFactorCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TWO_FACTOR_COOKIE_MAX_AGE
  };
}

export function shouldExposeDebugTwoFactorCode() {
  return process.env.ALLOW_DEBUG_2FA === "true";
}

export function generateTwoFactorCode() {
  try {
    const values = new Uint32Array(1);
    crypto.getRandomValues(values);
    const value = 100000 + ((values[0] ?? 0) % 900000);
    return String(value);
  } catch {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
}

export function isValidTwoFactorCodeFormat(code: string) {
  return /^\d{6}$/.test(code.trim());
}

export function maskEmail(email: string) {
  const normalized = normalizeEmail(email);
  const [name, domain] = normalized.split("@");

  if (!name || !domain) {
    return normalized;
  }

  if (name.length <= 2) {
    return `${name[0] ?? "*"}*@${domain}`;
  }

  return `${name.slice(0, 2)}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

export function isSupportedSocialProvider(value: string): value is SocialProvider {
  return value === "google";
}

export function isValidAdminCredentials(email: string, password: string) {
  const configuredEmail = process.env.CLUB_ADMIN_EMAIL?.trim().toLowerCase();
  const configuredPassword = process.env.CLUB_ADMIN_PASSWORD;

  if (!configuredEmail || !configuredPassword) {
    if (!didWarnMissingAdminCredentials) {
      console.warn(
        "[auth] Missing CLUB_ADMIN_EMAIL or CLUB_ADMIN_PASSWORD. Admin login is disabled until credentials are configured."
      );
      didWarnMissingAdminCredentials = true;
    }
    return false;
  }

  return normalizeEmail(email) === configuredEmail && password === configuredPassword;
}
