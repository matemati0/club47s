"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ConsentMode = "all" | "essential";

const STORAGE_KEY = "club47-cookie-consent-v1";

function persistConsent(consent: ConsentMode) {
  window.localStorage.setItem(STORAGE_KEY, consent);

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `cookie_consent=${consent}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`;
}

export function CookieConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "all" || stored === "essential") {
      return;
    }

    setIsVisible(true);
  }, []);

  if (!isVisible) {
    return null;
  }

  return (
    <aside
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-4 right-4 z-[70] rounded-xl border border-club-darkGray bg-club-panel/95 p-4 shadow-2xl backdrop-blur md:left-auto md:max-w-md"
      role="dialog"
      aria-live="polite"
      aria-label="העדפות קוקיז"
    >
      <p className="text-sm font-medium text-club-white">הודעת Cookies</p>
      <p className="mt-2 text-xs leading-relaxed text-club-lightGray">
        אנחנו משתמשים בקוקיז חיוניים להפעלת האתר. קוקיז אנליטיקה ושיווק יופעלו רק לאחר אישור
        שלך.
      </p>

      <p className="mt-2 text-xs text-club-lightGray">
        ניתן לקרוא פירוט מלא ב{" "}
        <Link href="/privacy-policy#cookie-policy" className="text-club-white hover:opacity-80">
          מדיניות הפרטיות
        </Link>
        .
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            persistConsent("all");
            setIsVisible(false);
          }}
          className="club-btn-primary h-10 w-full text-xs"
        >
          אישור הכל
        </button>
        <button
          type="button"
          onClick={() => {
            persistConsent("essential");
            setIsVisible(false);
          }}
          className="club-btn-secondary h-10 w-full text-xs"
        >
          רק חיוני
        </button>
      </div>
    </aside>
  );
}
