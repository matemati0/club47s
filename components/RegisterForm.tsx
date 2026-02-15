"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthActionError, useAuth } from "@/context/AuthContext";
import { registerSchema, twoFactorVerifySchema } from "@/lib/validation/auth";

type FieldErrors = {
  email?: string;
  password?: string;
  confirmPassword?: string;
  code?: string;
  form?: string;
};

type RegisterStep = "details" | "twoFactor";

export function RegisterForm() {
  const router = useRouter();
  const { register, verifyTwoFactor } = useAuth();
  const [step, setStep] = useState<RegisterStep>("details");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [code, setCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [debugCode, setDebugCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const parsed = registerSchema.safeParse({ email, password, confirmPassword });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0]
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await register(
        parsed.data.email,
        parsed.data.password,
        parsed.data.confirmPassword
      );

      if (result.requiresTwoFactor) {
        setStep("twoFactor");
        setMaskedEmail(result.maskedEmail ?? "");
        setDebugCode(result.debugCode ?? "");
        setPassword("");
        setConfirmPassword("");
        return;
      }

      router.push("/");
    } catch (submitError) {
      if (submitError instanceof AuthActionError) {
        setErrors({
          email: submitError.fieldErrors?.email,
          password: submitError.fieldErrors?.password,
          confirmPassword: submitError.fieldErrors?.confirmPassword,
          form:
            submitError.fieldErrors?.email ||
            submitError.fieldErrors?.password ||
            submitError.fieldErrors?.confirmPassword
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

  if (step === "twoFactor") {
    return (
      <form onSubmit={handleVerifyCodeSubmit} className="club-card p-6 sm:p-8 animate-fade" noValidate>
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
              setErrors((previous) => ({
                ...previous,
                code: undefined,
                form: undefined
              }));
            }}
            placeholder="קוד אימות בן 6 ספרות"
            className="club-field text-center tracking-[0.5em]"
            aria-invalid={Boolean(errors.code)}
            aria-describedby={errors.code ? "register-code-error" : undefined}
          />
          {errors.code ? (
            <p id="register-code-error" className="mt-2 text-right text-sm text-club-lightGray">
              {errors.code}
            </p>
          ) : null}
        </div>

        {debugCode ? (
          <p
            data-testid="register-debug-2fa-code"
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
            disabled={isVerifyingCode}
            className="club-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isVerifyingCode ? "מאמת..." : "אמת קוד והשלם הרשמה"}
          </button>
          <button
            type="button"
            disabled={isVerifyingCode}
            onClick={() => {
              setStep("details");
              setCode("");
              setMaskedEmail("");
              setDebugCode("");
              setErrors({});
            }}
            className="club-btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            חזור לפרטים
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="club-card p-6 sm:p-8 animate-fade" noValidate>
      <div className="space-y-4">
        <div>
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setErrors((previous) => ({
                ...previous,
                email: undefined,
                form: undefined
              }));
            }}
            placeholder="אימייל"
            className="club-field"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "register-email-error" : undefined}
          />
          {errors.email ? (
            <p id="register-email-error" className="mt-2 text-right text-sm text-club-lightGray">
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
              setErrors((previous) => ({
                ...previous,
                password: undefined,
                form: undefined
              }));
            }}
            placeholder="סיסמה"
            className="club-field"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "register-password-error" : undefined}
          />
          {errors.password ? (
            <p
              id="register-password-error"
              className="mt-2 text-right text-sm text-club-lightGray"
            >
              {errors.password}
            </p>
          ) : null}
        </div>

        <div>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              setErrors((previous) => ({
                ...previous,
                confirmPassword: undefined,
                form: undefined
              }));
            }}
            placeholder="אימות סיסמה"
            className="club-field"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirmPassword)}
            aria-describedby={errors.confirmPassword ? "register-confirm-password-error" : undefined}
          />
          {errors.confirmPassword ? (
            <p
              id="register-confirm-password-error"
              className="mt-2 text-right text-sm text-club-lightGray"
            >
              {errors.confirmPassword}
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
        disabled={isSubmitting}
        className="club-btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "שולח קוד אימות..." : "יצירת חשבון ושליחת קוד"}
      </button>

      <p className="mt-5 text-center text-sm text-club-lightGray">
        יש לך כבר חשבון?{" "}
        <Link href="/login" className="text-club-white hover:opacity-80">
          התחבר כאן
        </Link>
      </p>
    </form>
  );
}
