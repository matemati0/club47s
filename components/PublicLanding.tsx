"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Landing3DShowcase } from "@/components/Landing3DShowcase";
import { useTheme } from "@/context/ThemeContext";

const productHighlights = [
  {
    title: "ויאגרה",
    description: "ויאגרה גנרית (סילדנפיל) לזמן תגובה מהיר וביצועים חזקים.",
    href: "/viagra",
    imageSrc: "/landing/viagra-tablette.jpg",
    imageAlt: "מוצר ויאגרה על רקע לבן"
  },
  {
    title: "קאמגרה",
    description: "קאמגרה ג׳לי ומדבקות לספיגה מהירה, נוחות מלאה ודיסקרטיות.",
    href: "/kamagra",
    imageSrc: "/landing/kamagra-front100mg.jpg",
    imageAlt: "אריזת Kamagra 100mg"
  },
  {
    title: "סיאליס",
    description: "סיאליס גנרי (טדלפיל) לעד 36 שעות של ביטחון וגמישות.",
    href: "/cialis",
    imageSrc: "/landing/cialis-5mg-uk.jpg",
    imageAlt: "אריזת Cialis 5mg"
  }
];

const blogHighlights = [
  {
    title: "איך לדעת אם מוצר מזויף או לא",
    description:
      "מדריך זיהוי מהיר: אריזה, מספר אצווה, תאריך תוקף, מקור רכישה ומחיר חשוד.",
    href: "/blog/how-to-spot-fake-product-2026"
  },
  {
    title: "ויאגרה vs קאמגרה vs סיאליס - השוואה ל-2026",
    description:
      "השוואה מרוכזת בין שלושת המוצרים לפי זמן פעולה, נוחות שימוש ועלות.",
    href: "/blog/viagra-vs-kamagra-vs-cialis-2026"
  },
  {
    title: "צ׳ק ליסט להזמנה דיסקרטית בטוחה",
    description:
      "רשימת בדיקה קצרה לפני הזמנה: פרטי עסק, מדיניות, אריזה ותיעוד הזמנה.",
    href: "/blog/discreet-ordering-safety-checklist-2026"
  },
  {
    title: "שאלות נפוצות לפני הזמנה ראשונה",
    description:
      "תשובות מהירות לשאלות הנפוצות ביותר לפני התחברות, הרשמה והזמנה.",
    href: "/blog/first-order-faq-2026"
  }
];

const landingBackgrounds = [
  "/landing/public-bg-1.jpg",
  "/landing/public-bg-2.jpg",
  "/landing/public-bg-3.jpg"
];

const BACKGROUND_ROTATION_MS = 5500;

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: "he-IL",
  mainEntity: [
    {
      "@type": "Question",
      name: "מה ההבדל בין ויאגרה, קאמגרה וסיאליס?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ויאגרה מתאימה לרוב למי שמחפש תגובה מהירה, קאמגרה מוכרת בפורמטים נוחים כמו ג׳לי ומדבקות, וסיאליס מספקת טווח פעולה ארוך יותר עד 36 שעות."
      }
    },
    {
      "@type": "Question",
      name: "האם המשלוח ב-Club47 דיסקרטי?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "כן. המשלוח מתבצע באריזה אנונימית וללא סימון חיצוני מזוהה."
      }
    },
    {
      "@type": "Question",
      name: "איך מצטרפים למועדון?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "נרשמים בעמוד ההרשמה, מאמתים כתובת אימייל, ומתחברים לחשבון החברים עם אימות דו-שלבי."
      }
    }
  ]
};

export function PublicLanding() {
  const { theme, toggleTheme } = useTheme();
  const [activeBackgroundIndex, setActiveBackgroundIndex] = useState(0);
  const [autoRotateBackground, setAutoRotateBackground] = useState(true);
  const nextThemeLabel =
    theme === "dark" ? "למצב יום" : theme === "light" ? "למצב סגול" : "למצב לילה";

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const refreshMotionState = () => {
      const reducedByWidget = document.documentElement.dataset.a11yReduceMotion === "true";
      setAutoRotateBackground(!(media.matches || reducedByWidget));
    };

    refreshMotionState();

    const listener = () => refreshMotionState();
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", listener);
    } else if (typeof media.addListener === "function") {
      media.addListener(listener);
    }

    const observer = new MutationObserver(refreshMotionState);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-a11y-reduce-motion"]
    });

    return () => {
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", listener);
      } else if (typeof media.removeListener === "function") {
        media.removeListener(listener);
      }
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!autoRotateBackground) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveBackgroundIndex((prev) => (prev + 1) % landingBackgrounds.length);
    }, BACKGROUND_ROTATION_MS);

    return () => window.clearInterval(intervalId);
  }, [autoRotateBackground]);

  return (
    <main className="relative overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        {landingBackgrounds.map((backgroundSrc, index) => (
          <div
            key={backgroundSrc}
            data-active={index === activeBackgroundIndex}
            className="landing-hero-bg-layer"
            style={{ backgroundImage: `url(${backgroundSrc})` }}
          />
        ))}
        <div className="landing-hero-bg-mask" />
      </div>

      <div className="club-shell py-6 sm:py-12">
        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.9fr]">
          <article className="club-panel animate-fade p-8 sm:p-10">
          <p className="club-kicker">דף נחיתה ציבורי</p>
          <h1 className="mt-4 text-3xl font-medium leading-tight text-club-white sm:text-5xl">
            Club47 - <strong>ויאגרה</strong> | <strong>קאמגרה</strong> | <strong>סיאליס</strong>
            <span className="mt-2 block text-2xl sm:text-4xl">הגישה הפרטית שלך למה שבאמת עובד</span>
          </h1>

          <p className="mt-6 text-base leading-relaxed text-club-lightGray sm:text-lg">
            מחפש <strong>ויאגרה</strong> אמינה? רוצה <strong>קאמגרה</strong> מהירה וטעימה? או מעדיף
            <strong> סיאליס</strong> ל-36 שעות חופש מלא? ב-Club47 תמצא גישה דיסקרטית למוצרים
            הפופולריים ביותר עם אריזה אנונימית ומשלוח בכל הארץ.
          </p>

          <ul className="mt-6 space-y-3 text-sm leading-relaxed text-club-lightGray sm:text-base">
            <li>
              <strong className="text-club-white">ויאגרה גנרית (סילדנפיל):</strong> זקפה חזקה ומהירה
              למי שמעדיף קלאסיקה אמינה.
            </li>
            <li>
              <strong className="text-club-white">קאמגרה ג׳לי / מדבקות:</strong> ספיגה תוך דקות,
              טעמים נוחים ושימוש מהיר בלי סרבול.
            </li>
            <li>
              <strong className="text-club-white">סיאליס גנרי (טדלפיל):</strong> עד יום וחצי של
              ביטחון ספונטני בלי לחץ של תזמון.
            </li>
          </ul>

            <Landing3DShowcase />
          </article>

          <section className="club-panel animate-fade p-8 sm:p-10">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="club-kicker">הצטרפות מהירה</p>
                <h2 className="mt-3 text-2xl font-medium text-club-white sm:text-3xl">
                  הרשמה או התחברות לחברים
                </h2>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className="h-fit rounded-lg border border-club-darkGray px-3 py-2 text-xs text-club-lightGray hover:border-club-white hover:text-club-white sm:px-4 sm:text-sm"
              >
                {nextThemeLabel}
              </button>
            </div>

            <p className="mb-8 text-sm leading-relaxed text-club-lightGray sm:text-base">
              זהו עמוד הנחיתה הציבורי של Club47. מכאן ממשיכים להרשמה או להתחברות מאובטחת.
            </p>

            <div className="grid gap-3">
              <Link href="/register" className="club-btn-primary h-12 px-6 text-base">
                הרשמה למועדון - גישה פרטית עכשיו
              </Link>
              <Link href="/login" className="club-btn-secondary h-12 px-6 text-base">
                כניסת חברים
              </Link>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-club-lightGray">
              18+ בלבד | אריזה ללא כיתובים | משלוח אנונימי ודיסקרטי
            </p>
          </section>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          {productHighlights.map((item) => (
            <article key={item.title} className="club-card p-5 sm:p-6">
              <div
                data-slot={`card-image-${item.href.replace("/", "")}`}
                className="relative mb-4 aspect-[4/3] overflow-hidden rounded-lg border border-club-darkGray bg-club-panel"
              >
                <Image
                  src={item.imageSrc}
                  alt={item.imageAlt}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <h2 className="text-xl font-medium text-club-white">
                <strong>{item.title}</strong>
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-club-lightGray">{item.description}</p>
              <Link href={item.href} className="mt-5 inline-flex text-sm text-club-white hover:opacity-80">
                קרא עוד על {item.title}
              </Link>
            </article>
          ))}
        </section>

        <section className="club-panel mt-8 animate-fade p-6 sm:p-8">
          <p className="club-kicker">מדריך חשוב</p>
          <h2 className="mt-3 text-2xl font-medium text-club-white sm:text-3xl">
            איך לדעת אם מוצר מזויף או לא?
          </h2>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-club-lightGray sm:text-base">
            לפני כל רכישה, חשוב לבדוק סימנים בסיסיים שיכולים להצביע על מוצר מזויף. הנה רשימת בדיקה
            קצרה:
          </p>

          <ul className="mt-4 list-disc space-y-2 pr-5 text-sm text-club-lightGray sm:text-base">
            <li>האריזה מודפסת באיכות נמוכה, עם שגיאות כתיב או מדבקות לא אחידות.</li>
            <li>אין מספר אצווה ברור, תאריך תוקף תקין או פרטי יצרן מזוהים.</li>
            <li>צורת הטבליה/צבע/ריח שונים משמעותית מהתיאור הרשמי.</li>
            <li>המחיר נמוך בצורה חריגה או שיש לחץ לקנייה מהירה ללא מידע שקוף.</li>
            <li>אין פרטי עסק מלאים, מדיניות ברורה או מענה שירות מסודר.</li>
          </ul>

          <Link
            href="/blog/how-to-spot-fake-product-2026"
            className="club-btn-secondary mt-6 h-11 w-fit px-5"
          >
            לקריאת המדריך המלא
          </Link>
        </section>

        <section className="club-panel mt-8 animate-fade p-6 sm:p-8">
          <p className="club-kicker">מאמרים ובלוג</p>
          <h2 className="mt-3 text-2xl font-medium text-club-white sm:text-3xl">
            עוד מדריכים חשובים לקריאה לפני הזמנה
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {blogHighlights.map((article) => (
              <article key={article.href} className="club-card p-5 sm:p-6">
                <h3 className="text-lg font-medium text-club-white">{article.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-club-lightGray">{article.description}</p>
                <Link
                  href={article.href}
                  className="mt-5 inline-flex text-sm text-club-white hover:opacity-80"
                >
                  המשך לקריאת המאמר
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
