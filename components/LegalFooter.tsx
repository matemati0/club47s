import Link from "next/link";
import { businessDetails } from "@/lib/legal/businessDetails";

export function LegalFooter() {
  return (
    <footer className="border-t border-club-darkGray bg-club-panel/70">
      <div className="club-shell py-6 sm:py-8">
        <div className="grid gap-6 text-sm text-club-lightGray md:grid-cols-[1.3fr_1fr]">
          <div className="space-y-2">
            <p className="font-medium text-club-white">פרטי עסק ושירות</p>
            <p>שם העסק: {businessDetails.name}</p>
            <p>טלפון: {businessDetails.phone}</p>
            <p>אימייל שירות: {businessDetails.email}</p>
            <p>כתובת/מיקום פעילות: {businessDetails.address}</p>
            <p>מספר עוסק/ח.פ: {businessDetails.registrationId}</p>
            <p className="pt-1 text-xs leading-relaxed">{businessDetails.returnsPolicy}</p>
          </div>

          <nav className="space-y-2">
            <p className="font-medium text-club-white">מסמכים משפטיים</p>
            <p>
              <Link href="/privacy-policy" className="hover:text-club-white">
                מדיניות פרטיות
              </Link>
            </p>
            <p>
              <Link href="/privacy-policy#cookie-policy" className="hover:text-club-white">
                מדיניות Cookies
              </Link>
            </p>
            <p>
              <Link href="/terms-of-use" className="hover:text-club-white">
                תנאי שימוש ורכישה
              </Link>
            </p>
            <p className="pt-1 text-xs">גלישה באתר וביצוע הזמנה כפופים למסמכים אלו.</p>
          </nav>
        </div>
      </div>
    </footer>
  );
}
