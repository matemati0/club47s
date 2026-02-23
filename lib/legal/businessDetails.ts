export const LEGAL_LAST_UPDATED = "23.02.2026";

export const businessDetails = {
  name: process.env.NEXT_PUBLIC_BUSINESS_NAME ?? "Club 47",
  phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? "+972-53-919-5024",
  email:
    process.env.NEXT_PUBLIC_BUSINESS_EMAIL ??
    process.env.RESEND_FROM_EMAIL ??
    "service@club47s.com",
  address: process.env.NEXT_PUBLIC_BUSINESS_ADDRESS ?? "ישראל",
  registrationId:
    process.env.NEXT_PUBLIC_BUSINESS_ID ?? "פרטי עוסק/ח.פ נשלחים במסמכי העסקה",
  returnsPolicy:
    process.env.NEXT_PUBLIC_RETURNS_POLICY ??
    "ביטול או החזרה יתבצעו לפי חוק הגנת הצרכן, בכפוף לסוג המוצר, מועד האספקה ומצב המוצר."
};
