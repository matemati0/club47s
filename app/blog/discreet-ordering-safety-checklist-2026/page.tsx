import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "צ׳ק ליסט להזמנה דיסקרטית בטוחה - 2026",
  description:
    "רשימת בדיקה לפני הזמנה אונליין: פרטי עסק, עמודי מדיניות, תיעוד הזמנה, ערוצי שירות ואימות מסודר."
};

const articleSchema = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "צ׳ק ליסט להזמנה דיסקרטית בטוחה - 2026",
  description: "מדריך קצר להזמנה דיסקרטית עם מינימום סיכון ומקסימום שקיפות.",
  author: {
    "@type": "Organization",
    name: "Club47"
  },
  publisher: {
    "@type": "Organization",
    name: "Club47"
  },
  mainEntityOfPage: "https://club47s.com/blog/discreet-ordering-safety-checklist-2026",
  datePublished: "2026-02-25",
  dateModified: "2026-02-25",
  inLanguage: "he-IL"
};

export default function SafeOrderingChecklistPage() {
  return (
    <main className="club-shell py-10 sm:py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <article className="club-panel animate-fade p-8 sm:p-10">
        <p className="club-kicker">מאמר בלוג</p>
        <h1 className="mt-4 text-3xl font-medium leading-tight text-club-white sm:text-5xl">
          צ׳ק ליסט להזמנה דיסקרטית בטוחה
        </h1>

        <p className="mt-6 max-w-3xl text-base leading-relaxed text-club-lightGray sm:text-lg">
          לפני שמבצעים הזמנה, כדאי לעבור על רשימה קצרה שמקטינה טעויות ועוזרת לזהות האם מדובר
          בשירות אמין.
        </p>

        <ol className="mt-8 list-decimal space-y-3 pr-5 text-sm leading-relaxed text-club-lightGray sm:text-base">
          <li>ודא שיש פרטי עסק גלויים: שם, טלפון, אימייל ודרך יצירת קשר.</li>
          <li>בדוק שקיימים עמודי מדיניות פרטיות, Cookies ותנאי שימוש.</li>
          <li>וודא שהאתר עובד תחת HTTPS ולא על חיבור לא מאובטח.</li>
          <li>שמור צילום מסך של פירוט ההזמנה והמחיר לפני תשלום.</li>
          <li>בדוק מהן אפשרויות המשלוח והאם יש התחייבות לאריזה דיסקרטית.</li>
          <li>וודא שיש ערוץ שירות פעיל במקרה של שאלה או תקלה.</li>
          <li>הימנע מהזמנה בלחץ זמן או מהצעה ״חד פעמית״ אגרסיבית.</li>
        </ol>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="club-btn-secondary h-11 px-5">
            חזרה לדף הנחיתה
          </Link>
          <Link href="/blog/how-to-spot-fake-product-2026" className="club-btn-secondary h-11 px-5">
            איך לזהות מוצר מזויף
          </Link>
        </div>
      </article>
    </main>
  );
}
