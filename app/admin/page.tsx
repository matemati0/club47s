"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { useAuth } from "@/context/AuthContext";

export default function AdminPage() {
  const router = useRouter();
  const { mode, isAdmin } = useAuth();

  useEffect(() => {
    if (mode !== "admin") {
      router.replace("/admin/login");
    }
  }, [mode, router]);

  if (!isAdmin) {
    return <div className="min-h-screen bg-club-black" />;
  }

  return <AdminPanel />;
}
