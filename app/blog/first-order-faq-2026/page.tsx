import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "שאלות נפוצות לפני הזמנה ראשונה - 2026",
  description:
    "FAQ למשתמש חדש: הרשמה, התחברות, פרטיות, משלוחים, בדיקת אמינות ותיעוד הזמנה."
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  inLanguage: "he-IL",
  mainEntity: [
    {
      "@type": "Question",
      name: "מה לבדוק לפני ההזמנה הראשונה?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "בדוק פרטי עסק, מסמכי מדיניות, חיבור HTTPS וערוץ שירות לקוחות פעיל."
      }
    },
    {
      "@type": "Question",
      name: "איך מצמצמים סיכון לרכישת מוצר לא אמין?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "משווים תיאור מוצר לאריזה בפועל, בודקים אצווה ותוקף, ונמנעים ממחיר חריג מדי."
      }
    },
    {
      "@type": "Question",
      name: "מה עושים במקרה של חשד לבעיה במוצר?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "עוצרים שימוש, שומרים תיעוד ופונים מיד לשירות לקוחות. במקרה הצורך פונים לייעוץ רפואי."
      }
    }
  ]
};

export default function FirstOrderFaqPage() {
  return (
    <main className="club-shell py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <article className="club-panel animate-fade p-8 sm:p-10">
        <p className="club-kicker">מאמר בלוג</p>
        <h1 className="mt-4 text-3xl font-medium leading-tight text-club-white sm:text-5xl">
          שאלות נפוצות לפני הזמנה ראשונה
        </h1>

        <div className="mt-8 space-y-7 text-sm leading-relaxed text-club-lightGray sm:text-base">
          <section>
            <h2 className="text-2xl font-medium text-club-white">איך מתחילים נכון?</h2>
            <p className="mt-3">
              מתחילים מהרשמה בסיסית, עוברים על המסמכים המשפטיים, ובודקים מה בדיוק כלול בהזמנה
              (כמות, מחיר, משלוח וזמן אספקה).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-club-white">האם אפשר לסמוך רק על תמונת מוצר?</h2>
            <p className="mt-3">
              לא. תמונה היא אינדיקציה חלקית בלבד. חשוב לבדוק גם אצווה, תוקף, תיאור מוצר, פרטי ספק
              ואמינות הערוץ שממנו מזמינים.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-club-white">מה לשמור אחרי ההזמנה?</h2>
            <ul className="mt-3 list-disc space-y-1 pr-5">
              <li>צילום מסך של פרטי ההזמנה והמחיר.</li>
              <li>אישור תשלום והודעות שירות.</li>
              <li>תיעוד תאריך הגעת המשלוח ותמונת אריזה בעת קבלה.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-medium text-club-white">מה עושים אם יש חוסר התאמה?</h2>
            <p className="mt-3">
              פונים מיד לשירות הלקוחות עם תמונות ותיעוד. עד לקבלת מענה מסודר - לא משתמשים במוצר
              חשוד.
            </p>
          </section>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="club-btn-secondary h-11 px-5">
            חזרה לדף הנחיתה
          </Link>
          <Link href="/blog/discreet-ordering-safety-checklist-2026" className="club-btn-secondary h-11 px-5">
            לצ׳ק ליסט המלא
          </Link>
        </div>
      </article>
    </main>
  );
}
