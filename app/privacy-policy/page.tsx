import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL_LAST_UPDATED, businessDetails } from "@/lib/legal/businessDetails";

export const metadata: Metadata = {
  title: "מדיניות פרטיות | Club 47",
  description: "פירוט איסוף מידע, שימוש, שמירה ושיתוף מידע באתר Club 47."
};

export default function PrivacyPolicyPage() {
  return (
    <main className="club-shell py-10 sm:py-14">
      <section className="club-panel p-6 sm:p-10">
        <p className="club-kicker">PRIVACY POLICY</p>
        <h1 className="mt-4 text-3xl font-medium text-club-white sm:text-4xl">מדיניות פרטיות</h1>
        <p className="mt-3 text-sm text-club-lightGray">עדכון אחרון: {LEGAL_LAST_UPDATED}</p>

        <div className="mt-8 space-y-8 text-sm leading-relaxed text-club-lightGray sm:text-base">
          <section>
            <h2 className="text-lg font-medium text-club-white">1. איזה מידע נאסף</h2>
            <ul className="mt-3 list-disc space-y-1 pr-5">
              <li>פרטי הזדהות והרשמה: אימייל, סיסמה, וקוד אימות דו-שלבי.</li>
              <li>פרטי יצירת קשר שמוזנים בטפסים או בהזמנה (למשל שם/טלפון, אם נמסרו).</li>
              <li>נתוני שימוש טכניים: כתובת IP, סוג דפדפן, עמודים שנצפו, זמני גישה.</li>
              <li>נתוני Cookies לצורך תפעול, אבטחה, אנליטיקה ושיווק (לפי בחירתך).</li>
              <li>נתוני רכישה ותשלום לפי אופן הביצוע מול ערוצי ההזמנה.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-club-white">2. מטרות האיסוף והשימוש</h2>
            <ul className="mt-3 list-disc space-y-1 pr-5">
              <li>ניהול חשבון משתמש, התחברות ואימות זהות.</li>
              <li>אספקת שירות, ניהול הזמנות ותמיכת לקוחות.</li>
              <li>אבטחת מערכות, מניעת הונאה ושיפור חוויית המשתמש.</li>
              <li>עמידה בדרישות דין, רגולציה, הנהלת חשבונות ויישוב מחלוקות.</li>
              <li>מדידה ושיווק דיגיטלי רק בהתאם להעדפות ה-Cookies שניתנו.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-club-white">3. שמירת מידע ואבטחה</h2>
            <ul className="mt-3 list-disc space-y-1 pr-5">
              <li>המידע נשמר במערכות מאובטחות עם בקרות גישה פנימיות.</li>
              <li>תעבורת נתונים מתבצעת ב-HTTPS בסביבת ייצור.</li>
              <li>הנתונים נשמרים למשך הזמן הנדרש למטרות השירות, הדין והגנת זכויות.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-club-white">4. העברת מידע לצדדים שלישיים</h2>
            <ul className="mt-3 list-disc space-y-1 pr-5">
              <li>ספקי תשתית ואירוח לצורך הפעלת האתר.</li>
              <li>ספקי תקשורת ואימייל לצורך שליחת קודי אימות והודעות שירות.</li>
              <li>ספקי אנליטיקה/שיווק, רק אם המשתמש אישר Cookies לא-חיוניים.</li>
              <li>רשויות מוסמכות, במקרה של חובה חוקית או צו שיפוטי.</li>
            </ul>
          </section>

          <section id="cookie-policy">
            <h2 className="text-lg font-medium text-club-white">5. מדיניות Cookies</h2>
            <ul className="mt-3 list-disc space-y-1 pr-5">
              <li>Cookies חיוניים מופעלים תמיד לצורך התחברות, אבטחה ותפעול.</li>
              <li>Cookies של אנליטיקה/פרסום מופעלים רק לאחר בחירה ב״אישור הכל״.</li>
              <li>ניתן לבחור ״רק חיוני״ ולצמצם מעקב לא-חיוני.</li>
              <li>אפשר למחוק Cookies דרך הגדרות הדפדפן בכל עת.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-medium text-club-white">6. זכויות משתמש</h2>
            <p className="mt-3">
              ניתן לפנות לבקשה לעיון, תיקון או מחיקה של מידע אישי, בכפוף לחובות חוקיות החלות
              על העסק.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-medium text-club-white">7. יצירת קשר בנושאי פרטיות</h2>
            <p className="mt-3">שם העסק: {businessDetails.name}</p>
            <p>טלפון: {businessDetails.phone}</p>
            <p>אימייל: {businessDetails.email}</p>
            <p>כתובת: {businessDetails.address}</p>
          </section>
        </div>

        <div className="mt-10 border-t border-club-darkGray pt-5 text-sm text-club-lightGray">
          לקריאת המסמך המשלים:{" "}
          <Link href="/terms-of-use" className="text-club-white hover:opacity-80">
            תנאי שימוש ורכישה
          </Link>
          .
        </div>
      </section>
    </main>
  );
}
