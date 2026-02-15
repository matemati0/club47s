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
      router.push("/login");
    } catch {
      router.refresh();
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-club-darkGray bg-club-black/95 backdrop-blur">
      <div className="club-shell flex h-[74px] items-center justify-between">
        <div>
          <p className="club-kicker">מועדון חברים פרטי</p>
          <h1 className="mt-1 text-sm font-medium tracking-[0.28em] text-club-white">מועדון 47</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg border border-club-darkGray px-4 py-2 text-sm text-club-lightGray hover:border-club-white hover:text-club-white"
          >
            {nextThemeLabel}
          </button>

          {isAuthenticated || isAnonymous || isAdmin ? (
            <button
              type="button"
              onClick={handleExit}
              className="rounded-lg border border-club-darkGray px-4 py-2 text-sm text-club-lightGray hover:border-club-white hover:text-club-white"
            >
              {isAnonymous ? "כניסת חברים" : isAdmin ? "יציאת אדמין" : "יציאה"}
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
