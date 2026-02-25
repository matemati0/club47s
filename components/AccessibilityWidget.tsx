"use client";

import { useEffect, useState } from "react";

type TextScale = "100" | "112" | "125";

type AccessibilitySettings = {
  textScale: TextScale;
  highContrast: boolean;
  underlineLinks: boolean;
  reduceMotion: boolean;
};

const STORAGE_KEY = "club47-accessibility-v1";

const defaultSettings: AccessibilitySettings = {
  textScale: "100",
  highContrast: false,
  underlineLinks: false,
  reduceMotion: false
};

function applySettingsToDocument(settings: AccessibilitySettings) {
  const root = document.documentElement;
  root.dataset.a11yTextScale = settings.textScale;
  root.dataset.a11yHighContrast = settings.highContrast ? "true" : "false";
  root.dataset.a11yUnderlineLinks = settings.underlineLinks ? "true" : "false";
  root.dataset.a11yReduceMotion = settings.reduceMotion ? "true" : "false";
}

function parseStoredSettings(raw: string | null): AccessibilitySettings {
  if (!raw) {
    return defaultSettings;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<AccessibilitySettings> | null;
    if (!parsed) {
      return defaultSettings;
    }

    return {
      textScale:
        parsed.textScale === "112" || parsed.textScale === "125"
          ? parsed.textScale
          : "100",
      highContrast: Boolean(parsed.highContrast),
      underlineLinks: Boolean(parsed.underlineLinks),
      reduceMotion: Boolean(parsed.reduceMotion)
    };
  } catch {
    return defaultSettings;
  }
}

export function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  useEffect(() => {
    const initial = parseStoredSettings(window.localStorage.getItem(STORAGE_KEY));
    setSettings(initial);
    applySettingsToDocument(initial);
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    applySettingsToDocument(settings);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [isReady, settings]);

  if (!isReady) {
    return null;
  }

  return (
    <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-[72] sm:bottom-[calc(1.5rem+env(safe-area-inset-bottom))]">
      {isOpen ? (
        <section
          className="mb-3 w-[min(92vw,320px)] rounded-2xl border border-club-darkGray bg-club-panel/95 p-4 shadow-2xl backdrop-blur"
          role="dialog"
          aria-label="תפריט נגישות"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-club-white">אפשרויות נגישות</p>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-md border border-club-darkGray px-2 py-1 text-xs text-club-lightGray hover:border-club-white hover:text-club-white"
              aria-label="סגירת תפריט נגישות"
            >
              סגור
            </button>
          </div>

          <div className="mt-4 space-y-3 text-sm text-club-lightGray">
            <div>
              <p className="mb-2 text-xs tracking-wide">גודל טקסט</p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, textScale: "100" }))}
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    settings.textScale === "100"
                      ? "border-club-white text-club-white"
                      : "border-club-darkGray"
                  }`}
                >
                  רגיל
                </button>
                <button
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, textScale: "112" }))}
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    settings.textScale === "112"
                      ? "border-club-white text-club-white"
                      : "border-club-darkGray"
                  }`}
                >
                  בינוני
                </button>
                <button
                  type="button"
                  onClick={() => setSettings((prev) => ({ ...prev, textScale: "125" }))}
                  className={`rounded-lg border px-3 py-2 text-xs ${
                    settings.textScale === "125"
                      ? "border-club-white text-club-white"
                      : "border-club-darkGray"
                  }`}
                >
                  גדול
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                setSettings((prev) => ({ ...prev, highContrast: !prev.highContrast }))
              }
              className="flex w-full items-center justify-between rounded-lg border border-club-darkGray px-3 py-2 text-right hover:border-club-white"
              aria-pressed={settings.highContrast}
            >
              <span>ניגודיות גבוהה</span>
              <span>{settings.highContrast ? "פעיל" : "כבוי"}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setSettings((prev) => ({ ...prev, underlineLinks: !prev.underlineLinks }))
              }
              className="flex w-full items-center justify-between rounded-lg border border-club-darkGray px-3 py-2 text-right hover:border-club-white"
              aria-pressed={settings.underlineLinks}
            >
              <span>הדגשת קישורים</span>
              <span>{settings.underlineLinks ? "פעיל" : "כבוי"}</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setSettings((prev) => ({ ...prev, reduceMotion: !prev.reduceMotion }))
              }
              className="flex w-full items-center justify-between rounded-lg border border-club-darkGray px-3 py-2 text-right hover:border-club-white"
              aria-pressed={settings.reduceMotion}
            >
              <span>הפחתת אנימציות</span>
              <span>{settings.reduceMotion ? "פעיל" : "כבוי"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setSettings(defaultSettings)}
            className="mt-4 w-full rounded-lg border border-club-darkGray px-3 py-2 text-xs text-club-lightGray hover:border-club-white hover:text-club-white"
          >
            איפוס הגדרות נגישות
          </button>
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex h-12 w-12 items-center justify-center rounded-full border border-club-white bg-club-black text-xl text-club-white shadow-xl hover:opacity-90"
        aria-label={isOpen ? "סגירת תוסף נגישות" : "פתיחת תוסף נגישות"}
      >
        ♿
      </button>
    </div>
  );
}
