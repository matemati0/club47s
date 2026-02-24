import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ויאגרה vs קאמגרה vs סיאליס - השוואה ל-2026",
  description:
    "השוואה בין ויאגרה, קאמגרה וסיאליס: זמן פעולה, התאמה, טווחי מחירים ויתרונות מרכזיים לבחירה מדויקת יותר."
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "ויאגרה vs קאמגרה vs סיאליס - מה הכי מתאים לך ב-2026?",
  description:
    "השוואה בין ויאגרה, קאמגרה וסיאליס לפי זמן פעולה, נוחות שימוש והתאמה לאורח החיים.",
  author: {
    "@type": "Organization",
    name: "Club47"
  },
  publisher: {
    "@type": "Organization",
    name: "Club47"
  },
  mainEntityOfPage: "https://club47s.com/blog/viagra-vs-kamagra-vs-cialis-2026",
  datePublished: "2026-02-23",
  dateModified: "2026-02-23",
  inLanguage: "he-IL"
};

export default function ComparisonArticlePage() {
  return (
    <main className="club-shell py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <article className="club-panel animate-fade p-8 sm:p-10">
        <p className="club-kicker">מאמר בלוג</p>
        <h1 className="mt-4 text-3xl font-medium leading-tight text-club-white sm:text-5xl">
          <strong>ויאגרה</strong> vs <strong>קאמגרה</strong> vs <strong>סיאליס</strong> - מה הכי
          מתאים לך ב-2026?
        </h1>

        <p className="mt-6 max-w-3xl text-base leading-relaxed text-club-lightGray sm:text-lg">
          אם אתה מתלבט בין <strong>ויאגרה</strong>, <strong>קאמגרה</strong> או <strong>סיאליס</strong>,
          המדריך הזה מרכז את ההבדלים המרכזיים בצורה קצרה וברורה.
        </p>

        <section className="mt-8 space-y-8">
          <div>
            <h2 className="text-2xl font-medium text-club-white">ויאגרה - הקלאסיקה החזקה והמהירה</h2>
            <p className="mt-3 text-sm leading-relaxed text-club-lightGray sm:text-base">
              <strong>ויאגרה</strong> נחשבת לבחירה המוכרת ביותר עם תגובה מהירה יחסית. היא מתאימה למי
              שמחפש פעולה ממוקדת בזמן קצר.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-medium text-club-white">
              קאמגרה - החלופה הנוחה לויאגרה (ג׳לי ומדבקות)
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-club-lightGray sm:text-base">
              <strong>קאמגרה</strong> זמינה בפורמטים נוחים לשימוש מהיר. מי שמעדיף פתרון קל יותר
              לנטילה, לרוב בוחר <strong>קאמגרה</strong> במקום כדורים קלאסיים.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-medium text-club-white">סיאליס - הארוך ביותר, החופשי ביותר</h2>
            <p className="mt-3 text-sm leading-relaxed text-club-lightGray sm:text-base">
              <strong>סיאליס</strong> בולטת בזמן פעולה ארוך של עד 36 שעות. זו אופציה מתאימה למי
              שרוצה חופש תזמון לאורך היום והלילה.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-medium text-club-white">
              השוואה מהירה: ויאגרה | קאמגרה | סיאליס - מחיר, זמן פעולה, יתרונות
            </h2>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full border-collapse text-right text-sm text-club-lightGray">
                <thead>
                  <tr className="border-b border-club-darkGray text-club-white">
                    <th className="px-3 py-2">מוצר</th>
                    <th className="px-3 py-2">זמן פעולה משוער</th>
                    <th className="px-3 py-2">טווח מחיר לדוגמה</th>
                    <th className="px-3 py-2">יתרון מרכזי</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-club-darkGray/60">
                    <td className="px-3 py-2 text-club-white">ויאגרה</td>
                    <td className="px-3 py-2">קצר עד בינוני</td>
                    <td className="px-3 py-2">10 כדורים סביב 200 ₪</td>
                    <td className="px-3 py-2">פעולה ממוקדת ומהירה</td>
                  </tr>
                  <tr className="border-b border-club-darkGray/60">
                    <td className="px-3 py-2 text-club-white">קאמגרה</td>
                    <td className="px-3 py-2">מהיר במיוחד</td>
                    <td className="px-3 py-2">7 יח׳ סביב 170 ₪</td>
                    <td className="px-3 py-2">נוחות שימוש גבוהה</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 text-club-white">סיאליס</td>
                    <td className="px-3 py-2">עד 36 שעות</td>
                    <td className="px-3 py-2">10 כדורים סביב 200 ₪</td>
                    <td className="px-3 py-2">חופש תזמון רחב</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/viagra" className="club-btn-secondary h-11 px-5">
            לעמוד ויאגרה
          </Link>
          <Link href="/kamagra" className="club-btn-secondary h-11 px-5">
            לעמוד קאמגרה
          </Link>
          <Link href="/cialis" className="club-btn-secondary h-11 px-5">
            לעמוד סיאליס
          </Link>
        </div>
      </article>
    </main>
  );
}

