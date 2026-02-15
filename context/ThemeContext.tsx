"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "dark" | "light" | "purple";

type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  setTheme: (nextTheme: Theme) => void;
  toggleTheme: () => void;
};

const THEME_STORAGE_KEY = "club-theme-mode";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);
const THEME_ORDER: Theme[] = ["dark", "light", "purple"];

function resolveInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "purple") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getNextTheme(currentTheme: Theme) {
  const index = THEME_ORDER.indexOf(currentTheme);
  if (index < 0) {
    return "dark" as const;
  }
  return THEME_ORDER[(index + 1) % THEME_ORDER.length];
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(resolveInitialTheme());
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme === "light" ? "light" : "dark";
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isDark: theme !== "light",
      setTheme,
      toggleTheme: () => setTheme((currentTheme) => getNextTheme(currentTheme))
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
