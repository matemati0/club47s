import { signJson, verifyJson } from "@/lib/security/signedToken";

export type AuthMode = "guest" | "anonymous" | "member" | "admin";
export type SocialProvider = "google";
export type TwoFactorTargetMode = "member" | "admin";

export type RegisteredMemberCredentials = {
  email: string;
  password: string;
};

export const AUTH_COOKIE_NAME = "club-auth-mode";
export const REGISTERED_MEMBER_COOKIE_NAME = "club-member-profile";
export const TWO_FACTOR_COOKIE_NAME = "club-two-factor";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
export const TWO_FACTOR_COOKIE_MAX_AGE = 60 * 10;
export const DEFAULT_MEMBER_EMAIL = "member@club47.co.il";
export const DEFAULT_MEMBER_PASSWORD = "club47";
export const DEFAULT_ADMIN_EMAIL = "admin@club47.co.il";
export const DEFAULT_ADMIN_PASSWORD = "admin47";

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

export function getRegisteredMemberCookieOptions() {
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

export function serializeRegisteredMemberCredentials(
  email: string,
  password: string
) {
  const payload = JSON.stringify({
    email: normalizeEmail(email),
    password
  });

  return encodeURIComponent(payload);
}

export function parseRegisteredMemberCredentials(
  value?: string | null
): RegisteredMemberCredentials | null {
  if (!value) {
    return null;
  }

  try {
    const decoded = decodeURIComponent(value);
    const parsed = JSON.parse(decoded) as
      | { email?: string; password?: string }
      | null;

    if (!parsed?.email || !parsed?.password) {
      return null;
    }

    return {
      email: normalizeEmail(parsed.email),
      password: parsed.password
    };
  } catch {
    return null;
  }
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

export function isValidMockMemberCredentials(email: string, password: string) {
  const configuredEmail =
    process.env.CLUB_MEMBER_EMAIL?.trim().toLowerCase() ?? DEFAULT_MEMBER_EMAIL;
  const configuredPassword =
    process.env.CLUB_MEMBER_PASSWORD ?? DEFAULT_MEMBER_PASSWORD;

  return normalizeEmail(email) === configuredEmail && password === configuredPassword;
}

export function isValidAdminCredentials(email: string, password: string) {
  const configuredEmail =
    process.env.CLUB_ADMIN_EMAIL?.trim().toLowerCase() ?? DEFAULT_ADMIN_EMAIL;
  const configuredPassword =
    process.env.CLUB_ADMIN_PASSWORD ?? DEFAULT_ADMIN_PASSWORD;

  return normalizeEmail(email) === configuredEmail && password === configuredPassword;
}

export function isValidRegisteredMemberCredentials(
  email: string,
  password: string,
  credentials: RegisteredMemberCredentials | null
) {
  if (!credentials) {
    return false;
  }

  return normalizeEmail(email) === credentials.email && password === credentials.password;
}

export function isValidMemberCredentials(
  email: string,
  password: string,
  registeredCredentials: RegisteredMemberCredentials | null
) {
  return (
    isValidMockMemberCredentials(email, password) ||
    isValidRegisteredMemberCredentials(email, password, registeredCredentials)
  );
}
