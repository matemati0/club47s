"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthActionError, useAuth } from "@/context/AuthContext";
import type { SocialProvider } from "@/lib/auth";
import { loginSchema, twoFactorVerifySchema } from "@/lib/validation/auth";

type FieldErrors = {
  email?: string;
  password?: string;
  code?: string;
  provider?: string;
  form?: string;
};

type LoginStep = "credentials" | "twoFactor";

function resolveSocialErrorMessage(code: string) {
  if (code === "unsupported_provider") {
    return "ספק ההתחברות שנבחר אינו נתמך.";
  }
  if (code === "provider_not_configured") {
    return "התחברות חברתית עדיין לא הוגדרה במערכת.";
  }
  if (code === "oauth_denied") {
    return "התחברות בוטלה על ידי המשתמש.";
  }
  if (
    code === "missing_oauth_code" ||
    code === "missing_oauth_state" ||
    code === "expired_oauth_state" ||
    code === "invalid_oauth_state"
  ) {
    return "לא ניתן היה לאמת את ההתחברות החברתית. נסה שוב.";
  }
  if (code === "oauth_exchange_failed") {
    return "התחברות דרך הספק נכשלה. ודא שיש הרשאת אימייל ונסה שוב.";
  }
  return "";
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, verifyTwoFactor, loginWithSocial, continueAsAnonymous } = useAuth();
  const [step, setStep] = useState<LoginStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [debugCode, setDebugCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [socialLoading, setSocialLoading] = useState<SocialProvider | null>(null);
  const [errors, setErrors] = useState<FieldErrors>({});

  useEffect(() => {
    const socialError = searchParams.get("socialError");
    if (!socialError) {
      return;
    }

    const message = resolveSocialErrorMessage(socialError);
    if (!message) {
      return;
    }

    setErrors((previous) => ({
      ...previous,
      form: message
    }));
  }, [searchParams]);

  const handleCredentialsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0]
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await login(parsed.data.email, parsed.data.password);
      if (result.requiresTwoFactor) {
        setStep("twoFactor");
        setMaskedEmail(result.maskedEmail ?? "");
        setDebugCode(result.debugCode ?? "");
        setPassword("");
        return;
      }

      router.push("/");
    } catch (submitError) {
      if (submitError instanceof AuthActionError) {
        setErrors({
          email: submitError.fieldErrors?.email,
          password: submitError.fieldErrors?.password,
          form:
            submitError.fieldErrors?.email || submitError.fieldErrors?.password
              ? undefined
              : submitError.message
        });
      } else if (submitError instanceof Error) {
        setErrors({ form: submitError.message });
      } else {
        setErrors({ form: "אירעה שגיאה. נסה שוב." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCodeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const parsed = twoFactorVerifySchema.safeParse({ code });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        code: fieldErrors.code?.[0]
      });
      return;
    }

    setIsVerifyingCode(true);

    try {
      await verifyTwoFactor(parsed.data.code);
      router.push("/");
    } catch (verifyError) {
      if (verifyError instanceof AuthActionError) {
        setErrors({
          code: verifyError.fieldErrors?.code,
          form: verifyError.fieldErrors?.code ? undefined : verifyError.message
        });
      } else if (verifyError instanceof Error) {
        setErrors({ form: verifyError.message });
      } else {
        setErrors({ form: "אירעה שגיאה באימות הקוד. נסה שוב." });
      }
    } finally {
      setIsVerifyingCode(false);
    }
  };

  const handleSocialLogin = async (provider: SocialProvider) => {
    setErrors({});
    setSocialLoading(provider);

    try {
      await loginWithSocial(provider);
    } catch (socialError) {
      if (socialError instanceof AuthActionError) {
        setErrors({
          provider: socialError.fieldErrors?.provider,
          form: socialError.message
        });
      } else if (socialError instanceof Error) {
        setErrors({ form: socialError.message });
      } else {
        setErrors({ form: "לא ניתן להתחבר עם ספק זה כרגע" });
      }
    } finally {
      setSocialLoading(null);
    }
  };

  const handleAnonymousAccess = async () => {
    setErrors({});
    try {
      await continueAsAnonymous();
      router.push("/");
    } catch {
      setErrors({ form: "לא ניתן לעבור למצב אנונימי כעת" });
    }
  };

  const isBusy = isSubmitting || isVerifyingCode || socialLoading !== null;

  return (
    <div className="club-card p-6 sm:p-8 animate-fade">
      {step === "credentials" ? (
        <form onSubmit={handleCredentialsSubmit} noValidate>
          <div className="space-y-4">
            <div>
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors((prev) => ({ ...prev, email: undefined, form: undefined }));
                }}
                placeholder="אימייל"
                className="club-field"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email ? (
                <p id="email-error" className="mt-2 text-right text-sm text-club-lightGray">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((prev) => ({
                    ...prev,
                    password: undefined,
                    form: undefined
                  }));
                }}
                placeholder="סיסמה"
                className="club-field"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password ? (
                <p id="password-error" className="mt-2 text-right text-sm text-club-lightGray">
                  {errors.password}
                </p>
              ) : null}
            </div>
          </div>

          {errors.form ? (
            <p className="mt-4 text-sm text-club-lightGray" aria-live="polite">
              {errors.form}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isBusy}
            className="club-btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "שולח קוד אימות..." : "התחבר עם אימייל"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCodeSubmit} noValidate>
          <p className="text-sm leading-relaxed text-club-lightGray">
            נשלח קוד אימות חד-פעמי לכתובת {maskedEmail || "האימייל שלך"}.
          </p>

          <div className="mt-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(event) => {
                const next = event.target.value.replace(/\D/g, "").slice(0, 6);
                setCode(next);
                setErrors((prev) => ({ ...prev, code: undefined, form: undefined }));
              }}
              placeholder="קוד אימות בן 6 ספרות"
              className="club-field text-center tracking-[0.5em]"
              aria-invalid={Boolean(errors.code)}
              aria-describedby={errors.code ? "code-error" : undefined}
            />
            {errors.code ? (
              <p id="code-error" className="mt-2 text-right text-sm text-club-lightGray">
                {errors.code}
              </p>
            ) : null}
          </div>

          {debugCode ? (
            <p
              data-testid="debug-2fa-code"
              className="mt-3 text-center text-xs tracking-wide text-club-lightGray"
            >
              קוד בדיקה: {debugCode}
            </p>
          ) : null}

          {errors.form ? (
            <p className="mt-4 text-sm text-club-lightGray" aria-live="polite">
              {errors.form}
            </p>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="submit"
              disabled={isBusy}
              className="club-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isVerifyingCode ? "מאמת..." : "אמת קוד והתחבר"}
            </button>
            <button
              type="button"
              disabled={isBusy}
              onClick={() => {
                setStep("credentials");
                setCode("");
                setMaskedEmail("");
                setDebugCode("");
                setErrors({});
              }}
              className="club-btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              חזור
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 border-t border-club-darkGray pt-5">
        <p className="text-center text-xs tracking-[0.16em] text-club-lightGray">
          כניסה מהירה
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            disabled={isBusy}
            onClick={() => handleSocialLogin("google")}
            className="club-btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {socialLoading === "google" ? "מתחבר..." : "התחבר עם Gmail"}
          </button>
          <button
            type="button"
            disabled={isBusy}
            onClick={() => handleSocialLogin("facebook")}
            className="club-btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {socialLoading === "facebook" ? "מתחבר..." : "התחבר עם Facebook"}
          </button>
        </div>
        {errors.provider ? (
          <p className="mt-3 text-center text-sm text-club-lightGray">{errors.provider}</p>
        ) : null}
      </div>

      <p className="mt-5 text-center text-sm text-club-lightGray">
        אין לך חשבון?{" "}
        <Link href="/register" className="text-club-white hover:opacity-80">
          להרשמה
        </Link>
      </p>

      <p className="mt-3 text-center text-xs text-club-lightGray">
        גישת מנהל?{" "}
        <Link href="/admin/login" className="text-club-white hover:opacity-80">
          כניסה לפאנל אדמין
        </Link>
      </p>

      <button
        type="button"
        onClick={handleAnonymousAccess}
        className="club-btn-secondary mt-4 h-12 w-full text-base text-club-lightGray hover:text-club-white"
      >
        המשך כאנונימי
      </button>

      <p className="mt-4 text-center text-xs leading-relaxed text-club-lightGray">
        המשך שימוש באתר מהווה הסכמה ל{" "}
        <Link href="/terms-of-use" className="text-club-white hover:opacity-80">
          תנאי השימוש
        </Link>{" "}
        ול{" "}
        <Link href="/privacy-policy" className="text-club-white hover:opacity-80">
          מדיניות הפרטיות
        </Link>
        .
      </p>
    </div>
  );
}
