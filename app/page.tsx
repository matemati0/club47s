"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { AnonymousBanner } from "@/components/AnonymousBanner";
import { AnonymousContent, MemberContent } from "@/components/HomeContent";
import { PublicLanding } from "@/components/PublicLanding";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
  const router = useRouter();
  const { mode, isAnonymous, isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    if (mode === "admin") {
      router.replace("/admin");
    }
  }, [mode, router]);

  if (isAdmin) {
    return <div className="min-h-screen bg-club-black" />;
  }

  if (mode === "guest") {
    return <PublicLanding />;
  }

  return (
    <div className="min-h-screen bg-club-black text-club-white">
      <Header />

      {isAnonymous ? <AnonymousBanner /> : null}

      <main className="club-shell py-12 sm:py-16">
        <section className="club-panel animate-fade p-8 sm:p-12">
          <p className="club-kicker">אזור חברים פרטי</p>
          <h2 className="mt-5 text-3xl font-medium leading-tight sm:text-5xl lg:max-w-3xl">
            {isAuthenticated ? "הגישה המלאה שלך פעילה" : "מצב צפייה אנונימי פעיל"}
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-club-lightGray">
            {isAuthenticated
              ? "ברוך הבא למתחם החברים. כאן תראה תוכן בלעדי ותפריט מוצרים ייעודי לחברי המועדון."
              : "במצב אנונימי מוצג קטלוג המוצרים הכללי כולל פירוט מחירים ומשלוחים."}
          </p>
        </section>

        {isAuthenticated ? <MemberContent /> : <AnonymousContent />}
      </main>
    </div>
  );
}
