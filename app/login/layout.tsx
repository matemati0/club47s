import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "כניסת חברים",
  description:
    "עמוד התחברות לחברי Club47 עם אימות דו-שלבי."
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
