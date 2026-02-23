import { describe, expect, it } from "vitest";
import {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_MEMBER_EMAIL,
  DEFAULT_MEMBER_PASSWORD,
  createAuthToken,
  isSupportedSocialProvider,
  isValidAdminCredentials,
  isValidMemberCredentials,
  isValidMockMemberCredentials,
  maskEmail,
  parseRegisteredMemberCredentials,
  resolveAuthMode,
  shouldExposeDebugTwoFactorCode,
  serializeRegisteredMemberCredentials
} from "@/lib/auth";
import {
  loginSchema,
  registerSchema,
  socialLoginSchema,
  twoFactorVerifySchema
} from "@/lib/validation/auth";

describe("resolveAuthMode", () => {
  it("returns valid modes from signed token", async () => {
    const memberToken = await createAuthToken("member");
    const anonymousToken = await createAuthToken("anonymous");
    const adminToken = await createAuthToken("admin");

    await expect(resolveAuthMode(memberToken)).resolves.toBe("member");
    await expect(resolveAuthMode(anonymousToken)).resolves.toBe("anonymous");
    await expect(resolveAuthMode(adminToken)).resolves.toBe("admin");
  });

  it("falls back to guest for unknown values", async () => {
    await expect(resolveAuthMode(undefined)).resolves.toBe("guest");
    await expect(resolveAuthMode("member")).resolves.toBe("guest");
    await expect(resolveAuthMode("super-admin")).resolves.toBe("guest");
  });
});

describe("loginSchema", () => {
  it("accepts a valid payload", () => {
    const result = loginSchema.safeParse({
      email: "member@club47.co.il",
      password: "club47"
    });

    expect(result.success).toBe(true);
  });

  it("returns field errors in Hebrew for invalid payload", () => {
    const result = loginSchema.safeParse({
      email: "member-at-club47",
      password: ""
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.email?.[0]).toBe("יש להזין כתובת אימייל תקינה");
      expect(errors.password?.[0]).toBe("יש להזין סיסמה");
    }
  });
});

describe("registerSchema", () => {
  it("accepts a valid payload", () => {
    const result = registerSchema.safeParse({
      email: "new@club47.co.il",
      password: "secret12",
      confirmPassword: "secret12"
    });

    expect(result.success).toBe(true);
  });

  it("returns error when passwords do not match", () => {
    const result = registerSchema.safeParse({
      email: "new@club47.co.il",
      password: "secret12",
      confirmPassword: "secret34"
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      expect(errors.confirmPassword?.[0]).toBe("הסיסמאות אינן תואמות");
    }
  });
});

describe("twoFactorVerifySchema", () => {
  it("accepts 6-digit code", () => {
    const result = twoFactorVerifySchema.safeParse({ code: "123456" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid format", () => {
    const result = twoFactorVerifySchema.safeParse({ code: "abc12" });
    expect(result.success).toBe(false);
  });
});

describe("socialLoginSchema", () => {
  it("accepts google provider", () => {
    expect(socialLoginSchema.safeParse({ provider: "google" }).success).toBe(true);
  });

  it("rejects unknown provider", () => {
    const result = socialLoginSchema.safeParse({ provider: "twitter" });
    expect(result.success).toBe(false);
  });
});

describe("mock credentials", () => {
  it("accepts default credentials", () => {
    expect(
      isValidMockMemberCredentials(DEFAULT_MEMBER_EMAIL, DEFAULT_MEMBER_PASSWORD)
    ).toBe(true);
  });

  it("rejects incorrect credentials", () => {
    expect(isValidMockMemberCredentials("wrong@club47.co.il", "nope")).toBe(false);
  });

  it("accepts default admin credentials", () => {
    expect(isValidAdminCredentials(DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD)).toBe(true);
  });
});

describe("registered member cookies", () => {
  it("supports serialization roundtrip", () => {
    const serialized = serializeRegisteredMemberCredentials(
      " user@Example.com ",
      "mypassword"
    );
    const parsed = parseRegisteredMemberCredentials(serialized);

    expect(parsed).toEqual({
      email: "user@example.com",
      password: "mypassword"
    });
  });

  it("is used by isValidMemberCredentials", () => {
    const serialized = serializeRegisteredMemberCredentials("hello@club.co.il", "topsecret");
    const parsed = parseRegisteredMemberCredentials(serialized);

    expect(isValidMemberCredentials("hello@club.co.il", "topsecret", parsed)).toBe(true);
    expect(isValidMemberCredentials("hello@club.co.il", "wrong", parsed)).toBe(false);
  });
});

describe("two-factor helpers", () => {
  it("masks email and validates social providers", () => {
    expect(maskEmail("member@club47.co.il")).toContain("***");
    expect(isSupportedSocialProvider("google")).toBe(true);
    expect(isSupportedSocialProvider("facebook")).toBe(false);
    expect(isSupportedSocialProvider("twitter")).toBe(false);
  });

  it("only exposes debug code when explicitly enabled in production", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    const originalAllowDebug = process.env.ALLOW_DEBUG_2FA;

    process.env.NODE_ENV = "production";
    process.env.ALLOW_DEBUG_2FA = "false";
    expect(shouldExposeDebugTwoFactorCode()).toBe(false);

    process.env.ALLOW_DEBUG_2FA = "true";
    expect(shouldExposeDebugTwoFactorCode()).toBe(true);

    process.env.NODE_ENV = originalNodeEnv;
    process.env.ALLOW_DEBUG_2FA = originalAllowDebug;
  });
});
