import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ויאגרה גנרית - Cenforce | Fildena",
  description:
    "עמוד ויאגרה גנרית: Cenforce ו-Fildena, מידע על חוזקים, טווחי מחירים ושימוש דיסקרטי לחברי Club47."
};

export default function ViagraPage() {
  return (
    <main className="club-shell py-10 sm:py-14">
      <article className="club-panel animate-fade p-8 sm:p-10">
        <p className="club-kicker">עמוד מוצר</p>
        <h1 className="mt-4 text-3xl font-medium text-club-white sm:text-5xl">
          <strong>ויאגרה</strong> גנרית - החוזק הקלאסי שכולם מכירים
        </h1>

        <p className="mt-6 max-w-3xl text-base leading-relaxed text-club-lightGray sm:text-lg">
          <strong>ויאגרה</strong> גנרית (Sildenafil) מתאימה למי שמחפש פעולה מהירה ואפקט יציב.
          ב-Club47 מוצעות גרסאות פופולריות כמו Cenforce 100/150/200 ו-Fildena באיכות עקבית.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="club-card p-5">
            <h2 className="text-xl font-medium text-club-white">חבילות לדוגמה</h2>
            <p className="mt-3 text-sm leading-relaxed text-club-lightGray">10 כדורים: 200 ₪</p>
            <p className="text-sm leading-relaxed text-club-lightGray">40 כדורים: 580-600 ₪</p>
          </div>
          <div className="club-card p-5">
            <h2 className="text-xl font-medium text-club-white">למי זה מתאים</h2>
            <p className="mt-3 text-sm leading-relaxed text-club-lightGray">
              למי שרוצה <strong>ויאגרה</strong> חזקה, מהירה ואמינה בלי זמן המתנה מיותר.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/register" className="club-btn-primary h-12 px-6 text-base">
            הרשמה למועדון
          </Link>
          <Link href="/" className="club-btn-secondary h-12 px-6 text-base">
            חזרה לדף הבית
          </Link>
        </div>

        <div className="mt-10 border-t border-club-darkGray pt-6 text-sm text-club-lightGray">
          <p>
            רוצה לבדוק חלופות? קרא גם על <Link href="/kamagra" className="text-club-white">קאמגרה</Link>{" "}
            ועל <Link href="/cialis" className="text-club-white">סיאליס</Link>.
          </p>
        </div>
      </article>
    </main>
  );
}
