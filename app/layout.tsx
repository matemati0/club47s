import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import { cookies } from "next/headers";
import "@/styles/globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { AUTH_COOKIE_NAME, resolveAuthMode } from "@/lib/auth";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "מועדון פרטי",
  description: "אזור פרטי לחברי המועדון"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = cookies();
  const initialMode = await resolveAuthMode(cookieStore.get(AUTH_COOKIE_NAME)?.value);

  return (
    <html lang="he" dir="rtl" data-theme="dark" suppressHydrationWarning>
      <body className={`${heebo.className} bg-club-black text-club-white antialiased`}>
        <ThemeProvider>
          <AuthProvider initialMode={initialMode}>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
