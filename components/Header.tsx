"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";

export function Header() {
  const router = useRouter();
  const { isAnonymous, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const nextThemeLabel =
    theme === "dark" ? "למצב יום" : theme === "light" ? "למצב סגול" : "למצב לילה";

  const handleExit = async () => {
    try {
      await logout();
      router.push("/");
    } catch {
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-club-darkGray bg-club-black/95 backdrop-blur">
      <div className="club-shell flex flex-wrap items-center justify-between gap-3 py-3 sm:min-h-[74px]">
        <div className="min-w-0">
          <p className="club-kicker whitespace-nowrap">מועדון חברים פרטי</p>
          <h1 className="mt-1 text-xs font-medium tracking-[0.2em] text-club-white sm:text-sm sm:tracking-[0.28em]">
            מועדון 47
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-club-darkGray px-3 py-2 text-xs text-club-lightGray hover:border-club-white hover:text-club-white sm:px-4 sm:text-sm"
          >
            {nextThemeLabel}
          </button>

          {isAuthenticated || isAnonymous || isAdmin ? (
            <button
              type="button"
              onClick={handleExit}
              className="rounded-lg border border-club-darkGray px-3 py-2 text-xs text-club-lightGray hover:border-club-white hover:text-club-white sm:px-4 sm:text-sm"
            >
              {isAnonymous ? "כניסת חברים" : isAdmin ? "יציאת אדמין" : "יציאה"}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
