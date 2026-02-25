import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "איך לדעת אם מוצר מזויף או לא - מדריך 2026",
  description:
    "מדריך מעשי לזיהוי מוצר חשוד: אריזה, אצווה, תוקף, מקור רכישה, מחיר חריג ומה עושים במקרה חשד לזיוף."
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "איך לדעת אם מוצר מזויף או לא - מדריך 2026",
  description:
    "כללי בדיקה בסיסיים לזיהוי מוצר חשוד לפני שימוש: אריזה, פרטי יצרן, אצווה ותיעוד רכישה.",
  author: {
    "@type": "Organization",
    name: "Club47"
  },
  publisher: {
    "@type": "Organization",
    name: "Club47"
  },
  mainEntityOfPage: "https://club47s.com/blog/how-to-spot-fake-product-2026",
  datePublished: "2026-02-25",
  dateModified: "2026-02-25",
  inLanguage: "he-IL"
};

export default function FakeProductGuidePage() {
  return (
    <main className="club-shell py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <article className="club-panel animate-fade p-8 sm:p-10">
        <p className="club-kicker">מאמר בלוג</p>
        <h1 className="mt-4 text-3xl font-medium leading-tight text-club-white sm:text-5xl">
          איך לדעת אם מוצר מזויף או לא?
        </h1>

        <p className="mt-6 max-w-3xl text-base leading-relaxed text-club-lightGray sm:text-lg">
          כשמדובר במוצרים רגישים, חשוב לבצע בדיקות בסיסיות לפני שימוש. המדריך הבא יעזור לזהות
          סימנים מחשידים ולהקטין סיכון.
        </p>

        <section className="mt-8 space-y-8 text-sm leading-relaxed text-club-lightGray sm:text-base">
          <div>
            <h2 className="text-2xl font-medium text-club-white">1. בדיקת אריזה והדפסה</h2>
            <p className="mt-3">
              חפש איכות הדפסה ירודה, שגיאות כתיב, לוגו לא מדויק, צבעים חריגים או מדבקות שנראות
              מודבקות ידנית.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-medium text-club-white">2. מספר אצווה ותאריך תוקף</h2>
            <p className="mt-3">
              מוצר תקין כולל לרוב מספר אצווה, תאריך ייצור ותוקף ברורים. היעדר פרטים או טשטוש
              בהדפסה הם סימן אזהרה.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-medium text-club-white">3. התאמה לתיאור המוצר</h2>
            <p className="mt-3">
              אם צבע, צורה, ריח או מרקם שונים משמעותית מהתיאור המקורי - אל תמשיך שימוש עד בדיקה.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-medium text-club-white">4. מקור רכישה ושקיפות עסקית</h2>
            <p className="mt-3">
              אתר אמין מציג פרטי עסק, מדיניות פרטיות ותנאי שימוש, לצד שירות לקוחות פעיל. היעדר
              פרטים כאלה מעלה סיכון.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-medium text-club-white">5. מחיר חריג</h2>
            <p className="mt-3">
              מחיר נמוך באופן קיצוני לעומת טווח השוק עשוי להעיד על בעיה. מחיר אטרקטיבי לבדו אינו
              הוכחת אמינות.
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-medium text-club-white">מה עושים אם יש חשד לזיוף?</h2>
            <ul className="mt-3 list-disc space-y-1 pr-5">
              <li>עצור שימוש מיידית.</li>
              <li>שמור אריזה ותיעוד רכישה.</li>
              <li>פנה לשירות הלקוחות עם פרטי ההזמנה.</li>
              <li>במקרה הצורך, פנה לייעוץ רפואי מקצועי.</li>
            </ul>
          </div>
        </section>

        <p className="mt-8 text-xs leading-relaxed text-club-lightGray">
          המאמר מספק מידע כללי בלבד ואינו מהווה ייעוץ רפואי או תחליף להתייעצות עם איש מקצוע.
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="club-btn-secondary h-11 px-5">
            חזרה לדף הנחיתה
          </Link>
          <Link href="/blog/viagra-vs-kamagra-vs-cialis-2026" className="club-btn-secondary h-11 px-5">
            מאמר השוואה: ויאגרה | קאמגרה | סיאליס
          </Link>
        </div>
      </article>
    </main>
  );
}
