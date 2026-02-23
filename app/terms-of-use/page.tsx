import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_LAST_UPDATED, businessDetails } from "@/lib/legal/businessDetails";

export const metadata: Metadata = {
  title: "תנאי שימוש | Club 47",
  description: "תנאי שימוש, תנאי רכישה, ביטולים והגבלת אחריות באתר Club 47."
};

export default function TermsOfUsePage() {
  return (
    <main className="club-shell py-10 sm:py-14">
      <section className="club-panel p-6 sm:p-10">
        <p className="club-kicker">TERMS OF USE</p>
        <h1 className="mt-4 text-3xl font-medium text-club-white sm:text-4xl">
          תנאי שימוש ורכישה
        </h1>
        <p className="mt-3 text-sm text-club-lightGray">עדכון אחרון: {LEGAL_LAST_UPDATED}</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-club-lightGray sm:text-base">
          <section>
            <h2 className="text-lg font-medium text-club-white">1. כללי</h2>
            <p className="mt-3">
              השימוש באתר מהווה הסכמה לתנאים אלו. אם אינך מסכים לתנאים, יש להימנע משימוש באתר.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-club-white">2. חשבון משתמש ואבטחה</h2>
            <ul className="mt-3 list-disc space-y-1 pr-5">
              <li>האחריות על שמירת פרטי ההתחברות חלה על המשתמש.</li>
              <li>האתר רשאי לדרוש אימות דו-שלבי ולחסום גישה במקרה חשד לשימוש לא מורשה.</li>
              <li>חל איסור למסור פרטי כניסה לצדדים שלישיים.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-club-white">3. תנאי רכישה ותשלום</h2>
            <ul className="mt-3 list-disc space-y-1 pr-5">
              <li>הצגת מוצרים ומחירים באתר אינה מהווה התחייבות בלתי חוזרת לאספקה.</li>
              <li>אישור הזמנה סופי כפוף לזמינות מלאי ולאימות פרטי ההזמנה.</li>
              <li>מחירים עשויים להתעדכן מעת לעת לפני אישור הזמנה סופי.</li>
              <li>הזמנה עשויה להתבצע דרך ערוצי קשר חיצוניים (למשל WhatsApp/Telegram).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-club-white">4. ביטולים, החזרות והחלפות</h2>
            <p className="mt-3">{businessDetails.returnsPolicy}</p>
            <p className="mt-2">
              במקרה של סתירה, הוראות הדין הישראלי וחוק הגנת הצרכן יגברו.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-club-white">5. הגבלת אחריות</h2>
            <ul className="mt-3 list-disc space-y-1 pr-5">
              <li>השירות ניתן כפי שהוא (AS IS), בכפוף להוראות הדין.</li>
              <li>העסק אינו מתחייב לזמינות רציפה ללא הפרעות או תקלות.</li>
              <li>העסק לא יישא באחריות לנזק עקיף או תוצאתי שנגרם משימוש באתר.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-club-white">6. קניין רוחני ושימוש מותר</h2>
            <ul className="mt-3 list-disc space-y-1 pr-5">
              <li>כל התכנים באתר מוגנים בזכויות קניין רוחני של העסק או של צדדים מורשים.</li>
              <li>אין להעתיק, להפיץ או לעשות שימוש מסחרי בתכנים ללא אישור מראש.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-club-white">7. פרטיות ו-Cookies</h2>
            <p className="mt-3">
              השימוש באתר כפוף גם ל{" "}
              <Link href="/privacy-policy" className="text-club-white hover:opacity-80">
                מדיניות הפרטיות
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-club-white">8. פרטי העסק ויצירת קשר</h2>
            <p className="mt-3">שם העסק: {businessDetails.name}</p>
            <p>טלפון: {businessDetails.phone}</p>
            <p>אימייל: {businessDetails.email}</p>
            <p>כתובת: {businessDetails.address}</p>
            <p>מספר עוסק/ח.פ: {businessDetails.registrationId}</p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-club-white">9. דין וסמכות שיפוט</h2>
            <p className="mt-3">
              על תנאים אלו יחולו דיני מדינת ישראל. סמכות השיפוט המקומית תיקבע בהתאם להוראות הדין.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
