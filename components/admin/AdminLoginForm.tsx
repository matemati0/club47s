"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthActionError, useAuth } from "@/context/AuthContext";
import { loginSchema, twoFactorVerifySchema } from "@/lib/validation/auth";

type FieldErrors = {
  email?: string;
  password?: string;
  code?: string;
  form?: string;
};

type Step = "credentials" | "twoFactor";

export function AdminLoginForm() {
  const router = useRouter();
  const { adminLogin, verifyTwoFactor } = useAuth();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [debugCode, setDebugCode] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

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
      const result = await adminLogin(parsed.data.email, parsed.data.password);
      if (result.requiresTwoFactor) {
        setStep("twoFactor");
        setMaskedEmail(result.maskedEmail ?? "");
        setDebugCode(result.debugCode ?? "");
        setPassword("");
        return;
      }

      router.push("/admin");
    } catch (error) {
      if (error instanceof AuthActionError) {
        setErrors({
          email: error.fieldErrors?.email,
          password: error.fieldErrors?.password,
          form: error.fieldErrors?.email || error.fieldErrors?.password ? undefined : error.message
        });
      } else if (error instanceof Error) {
        setErrors({ form: error.message });
      } else {
        setErrors({ form: "אירעה שגיאה. נסה שוב." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors({});

    const parsed = twoFactorVerifySchema.safeParse({ code });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({ code: fieldErrors.code?.[0] });
      return;
    }

    setIsVerifying(true);
    try {
      await verifyTwoFactor(parsed.data.code);
      router.push("/admin");
    } catch (error) {
      if (error instanceof AuthActionError) {
        setErrors({
          code: error.fieldErrors?.code,
          form: error.fieldErrors?.code ? undefined : error.message
        });
      } else if (error instanceof Error) {
        setErrors({ form: error.message });
      } else {
        setErrors({ form: "אירעה שגיאה באימות הקוד." });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const isBusy = isSubmitting || isVerifying;

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
                placeholder="אימייל אדמין"
                className="club-field"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email ? (
                <p className="mt-2 text-right text-sm text-club-lightGray">{errors.email}</p>
              ) : null}
            </div>

            <div>
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setErrors((prev) => ({ ...prev, password: undefined, form: undefined }));
                }}
                placeholder="סיסמה"
                className="club-field"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.password)}
              />
              {errors.password ? (
                <p className="mt-2 text-right text-sm text-club-lightGray">{errors.password}</p>
              ) : null}
            </div>
          </div>

          {errors.form ? (
            <p className="mt-4 text-sm text-club-lightGray">{errors.form}</p>
          ) : null}

          <button
            type="submit"
            disabled={isBusy}
            className="club-btn-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "שולח קוד..." : "כניסת אדמין"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleCodeSubmit} noValidate>
          <p className="text-sm leading-relaxed text-club-lightGray">
            קוד אימות נשלח לכתובת {maskedEmail || "האימייל שלך"}.
          </p>
          <div className="mt-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(event) => {
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                setErrors((prev) => ({ ...prev, code: undefined, form: undefined }));
              }}
              placeholder="קוד אימות בן 6 ספרות"
              className="club-field text-center tracking-[0.5em]"
              aria-invalid={Boolean(errors.code)}
            />
            {errors.code ? (
              <p className="mt-2 text-right text-sm text-club-lightGray">{errors.code}</p>
            ) : null}
          </div>

          {debugCode ? (
            <p data-testid="admin-debug-2fa-code" className="mt-3 text-xs text-club-lightGray">
              קוד בדיקה: {debugCode}
            </p>
          ) : null}

          {errors.form ? (
            <p className="mt-4 text-sm text-club-lightGray">{errors.form}</p>
          ) : null}

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="submit"
              disabled={isBusy}
              className="club-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isVerifying ? "מאמת..." : "אמת והיכנס לפאנל"}
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

      <p className="mt-5 text-center text-sm text-club-lightGray">
        חזרה להתחברות רגילה?{" "}
        <Link href="/login" className="text-club-white hover:opacity-80">
          למסך הכניסה
        </Link>
      </p>
    </div>
  );
}
