import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "קאמגרה - ג׳לי ומדבקות",
  description:
    "עמוד קאמגרה: Kamagra Oral Jelly ו-Oral Strips, ספיגה מהירה תוך דקות, מחירים לדוגמה ושימוש דיסקרטי."
};

export default function KamagraPage() {
  return (
    <main className="club-shell py-10 sm:py-14">
      <article className="club-panel animate-fade p-8 sm:p-10">
        <p className="club-kicker">PRODUCT PAGE</p>
        <h1 className="mt-4 text-3xl font-medium text-club-white sm:text-5xl">
          <strong>קאמגרה</strong> - הג׳לי והמדבקות שפועלים מהר
        </h1>

        <p className="mt-6 max-w-3xl text-base leading-relaxed text-club-lightGray sm:text-lg">
          <strong>קאמגרה</strong> היא חלופה נוחה ל-<strong>ויאגרה</strong>, עם גרסאות פופולריות כמו
          Kamagra Oral Jelly ו-Oral Strips. הספיגה מהירה, השימוש פשוט והחוויה דיסקרטית.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="club-card p-5">
            <h2 className="text-xl font-medium text-club-white">חבילות לדוגמה</h2>
            <p className="mt-3 text-sm leading-relaxed text-club-lightGray">Kamagra Oral Jelly (7 יח׳): 170 ₪</p>
            <p className="text-sm leading-relaxed text-club-lightGray">Oral Strips: פתרון דיסקרטי במיוחד</p>
          </div>
          <div className="club-card p-5">
            <h2 className="text-xl font-medium text-club-white">יתרונות מרכזיים</h2>
            <p className="mt-3 text-sm leading-relaxed text-club-lightGray">
              <strong>קאמגרה</strong> נספגת לרוב תוך כ-15 דקות ומתאימה לספונטניות בלי סרבול.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className="club-btn-primary h-12 px-6 text-base">
            הרשמה למועדון
          </Link>
          <Link href="/login" className="club-btn-secondary h-12 px-6 text-base">
            חזרה לעמוד הראשי
          </Link>
        </div>

        <div className="mt-10 border-t border-club-darkGray pt-6 text-sm text-club-lightGray">
          <p>
            לעוד השוואה: <Link href="/viagra" className="text-club-white">ויאגרה</Link> או{" "}
            <Link href="/cialis" className="text-club-white">סיאליס</Link>.
          </p>
        </div>
      </article>
    </main>
  );
}

