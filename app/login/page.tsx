"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/LoginForm";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export default function LoginPage() {
  const router = useRouter();
  const { mode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const nextThemeLabel =
    theme === "dark" ? "למצב יום" : theme === "light" ? "למצב סגול" : "למצב לילה";

  useEffect(() => {
    if (mode === "member") {
      router.replace("/");
      return;
    }

    if (mode === "admin") {
      router.replace("/admin");
    }
  }, [mode, router]);

  if (mode === "member" || mode === "admin") {
    return <div className="min-h-screen bg-club-black" />;
  }

  return (
    <main className="club-shell flex min-h-screen items-center justify-center py-12">
      <section className="club-panel w-full max-w-3xl p-8 text-center sm:p-12 animate-fade">
        <div className="mb-8 flex justify-start">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-club-darkGray px-4 py-2 text-sm text-club-lightGray hover:border-club-white hover:text-club-white"
          >
            {nextThemeLabel}
          </button>
        </div>

        <p className="club-kicker">MEMBERS ENTRY</p>
        <h1 className="mt-4 text-4xl font-medium tracking-wide text-club-white sm:text-5xl">
          כניסה לחברי Club47
        </h1>
        <p className="mt-4 text-base text-club-lightGray sm:text-lg">
          עמוד הנחיתה הציבורי זמין ב-Home. כאן מתחברים לחשבון החברים עם אימות דו-שלבי.
        </p>

        <div className="mx-auto mt-10 max-w-md">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}

