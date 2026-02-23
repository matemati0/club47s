import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ויאגרה | קאמגרה | סיאליס - כניסה והרשמה",
  description:
    "Club47 - ויאגרה, קאמגרה וסיאליס במקום אחד. כניסה לחברי מועדון או הרשמה מהירה לגישה פרטית ודיסקרטית."
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
