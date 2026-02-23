import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "סיאליס גנרי - Tadalafil",
  description:
    "עמוד סיאליס גנרי: Tadalafil לעד 36 שעות, טווחי מחירים לדוגמה והתאמה למי שמעדיף גמישות לאורך היום."
};

export default function CialisPage() {
  return (
    <main className="club-shell py-10 sm:py-14">
      <article className="club-panel animate-fade p-8 sm:p-10">
        <p className="club-kicker">PRODUCT PAGE</p>
        <h1 className="mt-4 text-3xl font-medium text-club-white sm:text-5xl">
          <strong>סיאליס</strong> - עד 36 שעות של חופש אמיתי
        </h1>

        <p className="mt-6 max-w-3xl text-base leading-relaxed text-club-lightGray sm:text-lg">
          <strong>סיאליס</strong> גנרי (Tadalafil) מתאים למי שמחפש טווח פעולה ארוך וגמישות לאורך יום ולילה.
          במקום תזמון מדויק, מקבלים מרחב בטוח ונוח יותר.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="club-card p-5">
            <h2 className="text-xl font-medium text-club-white">חבילות לדוגמה</h2>
            <p className="mt-3 text-sm leading-relaxed text-club-lightGray">10 כדורים: 200 ₪</p>
            <p className="text-sm leading-relaxed text-club-lightGray">40 כדורים: 500 ₪</p>
          </div>
          <div className="club-card p-5">
            <h2 className="text-xl font-medium text-club-white">יתרון עיקרי</h2>
            <p className="mt-3 text-sm leading-relaxed text-club-lightGray">
              <strong>סיאליס</strong> נותן ביטחון ליותר זמן ומתאים לאורח חיים ספונטני.
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
            קרא גם על <Link href="/viagra" className="text-club-white">ויאגרה</Link> ועל{" "}
            <Link href="/kamagra" className="text-club-white">קאמגרה</Link>.
          </p>
        </div>
      </article>
    </main>
  );
}
