"use client";

import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";

const productHighlights = [
  {
    title: "ויאגרה",
    description: "ויאגרה גנרית (סילדנפיל) לזמן תגובה מהיר וביצועים חזקים.",
    href: "/viagra"
  },
  {
    title: "קאמגרה",
    description: "קאמגרה ג׳לי ומדבקות לספיגה מהירה, נוחות מלאה ודיסקרטיות.",
    href: "/kamagra"
  },
  {
    title: "סיאליס",
    description: "סיאליס גנרי (טדלפיל) לעד 36 שעות של ביטחון וגמישות.",
    href: "/cialis"
  }
];

const landingImageSlots = [
  {
    id: "hero-main",
    title: "תמונה ראשית",
    subtitle: "Hero Image"
  },
  {
    id: "hero-secondary",
    title: "תמונת אווירה",
    subtitle: "Lifestyle Image"
  },
  {
    id: "hero-product",
    title: "תמונת מוצר",
    subtitle: "Product Close-up"
  }
];

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
  const nextThemeLabel =
    theme === "dark" ? "למצב יום" : theme === "light" ? "למצב סגול" : "למצב לילה";

  return (
    <main className="club-shell py-8 sm:py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

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

          <div className="mt-8">
            <p className="text-xs tracking-[0.16em] text-club-lightGray">מקומות לתמונות בדף הנחיתה</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {landingImageSlots.map((slot) => (
                <figure
                  key={slot.id}
                  data-slot={slot.id}
                  className="club-card overflow-hidden"
                >
                  <div className="flex aspect-[4/3] items-center justify-center border border-dashed border-club-darkGray bg-club-panel text-center">
                    <div>
                      <p className="text-sm font-medium text-club-white">{slot.title}</p>
                      <p className="mt-1 text-xs text-club-lightGray">{slot.subtitle}</p>
                    </div>
                  </div>
                </figure>
              ))}
            </div>
          </div>
        </article>

        <section className="club-panel animate-fade p-8 sm:p-10">
          <div className="mb-8 flex justify-between gap-3">
            <div>
              <p className="club-kicker">הצטרפות מהירה</p>
              <h2 className="mt-3 text-2xl font-medium text-club-white sm:text-3xl">
                הרשמה או התחברות לחברים
              </h2>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="h-fit rounded-lg border border-club-darkGray px-4 py-2 text-sm text-club-lightGray hover:border-club-white hover:text-club-white"
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
              className="mb-4 flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-club-darkGray bg-club-panel text-center"
            >
              <div>
                <p className="text-sm font-medium text-club-white">מקום לתמונה</p>
                <p className="mt-1 text-xs text-club-lightGray">{item.title}</p>
              </div>
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
        <p className="club-kicker">מאמר השוואה</p>
        <h2 className="mt-3 text-2xl font-medium text-club-white sm:text-3xl">
          ויאגרה vs קאמגרה vs סיאליס - מה הכי מתאים לך ב-2026?
        </h2>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-club-lightGray sm:text-base">
          מדריך השוואה מהיר בין <strong>ויאגרה</strong>, <strong>קאמגרה</strong> ו-
          <strong>סיאליס</strong>: זמני פעולה, התאמה לאורח חיים, טווחי מחירים ויתרונות מרכזיים.
        </p>
        <Link
          href="/blog/viagra-vs-kamagra-vs-cialis-2026"
          className="club-btn-secondary mt-6 h-11 w-fit px-5"
        >
          לקריאת המאמר המלא
        </Link>
      </section>
    </main>
  );
}
