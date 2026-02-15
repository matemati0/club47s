"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminProductsTab } from "@/components/admin/AdminProductsTab";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import type { Product } from "@/lib/products/types";

type AdminTab = "dashboard" | "products" | "orders" | "members" | "settings";

type OrderStatus = "new" | "confirmed" | "packed" | "delivered" | "cancelled";

type AdminOrder = {
  id: string;
  customer: string;
  channel: "whatsapp" | "telegram" | "phone";
  total: number;
  status: OrderStatus;
  createdAt: string;
  items: number;
};

type ClubMember = {
  id: string;
  name: string;
  email: string;
  tier: "regular" | "vip";
  status: "active" | "frozen";
  lastPurchase: string;
};

type AdminSettings = {
  businessName: string;
  whatsappNumber: string;
  telegramHandle: string;
  supportHours: string;
  announcement: string;
  allowAnonymousCatalog: boolean;
};

const initialOrders: AdminOrder[] = [
  {
    id: "ORD-10091",
    customer: "לקוח אנונימי",
    channel: "whatsapp",
    total: 700,
    status: "new",
    createdAt: "12.02.2026 09:14",
    items: 3
  },
  {
    id: "ORD-10090",
    customer: "חבר מועדון",
    channel: "telegram",
    total: 500,
    status: "confirmed",
    createdAt: "12.02.2026 08:21",
    items: 2
  },
  {
    id: "ORD-10089",
    customer: "לקוח חוזר",
    channel: "phone",
    total: 250,
    status: "delivered",
    createdAt: "11.02.2026 23:05",
    items: 1
  }
];

const initialMembers: ClubMember[] = [
  {
    id: "MEM-201",
    name: "דניאל א.",
    email: "daniel@club47.co.il",
    tier: "vip",
    status: "active",
    lastPurchase: "11.02.2026"
  },
  {
    id: "MEM-202",
    name: "רות ב.",
    email: "ruth@club47.co.il",
    tier: "regular",
    status: "active",
    lastPurchase: "09.02.2026"
  },
  {
    id: "MEM-203",
    name: "ניר ל.",
    email: "nir@club47.co.il",
    tier: "regular",
    status: "frozen",
    lastPurchase: "28.01.2026"
  }
];

const initialSettings: AdminSettings = {
  businessName: "מועדון 47",
  whatsappNumber: "053-9195024",
  telegramHandle: "@sodot_service",
  supportHours: "א׳-ה׳ 10:00-23:00",
  announcement: "הזמנות למועדון נפתחות בכל ערב מחדש בשעה 19:00.",
  allowAnonymousCatalog: true
};

function formatPrice(value: number) {
  return `${value.toLocaleString("he-IL")} ₪`;
}

function resolveOrderStatusLabel(status: OrderStatus) {
  if (status === "new") {
    return "חדש";
  }
  if (status === "confirmed") {
    return "אושר";
  }
  if (status === "packed") {
    return "באריזה";
  }
  if (status === "delivered") {
    return "נמסר";
  }
  return "בוטל";
}

export function AdminPanel() {
  const router = useRouter();
  const { logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [members, setMembers] = useState<ClubMember[]>(initialMembers);
  const [settings, setSettings] = useState<AdminSettings>(initialSettings);
  const [statusMessage, setStatusMessage] = useState("");

  const reloadProducts = useCallback(async () => {
    const response = await fetch("/api/admin/products", { cache: "no-store" });
    const payload = (await response.json().catch(() => null)) as
      | { products?: Product[]; message?: string }
      | null;

    if (!response.ok) {
      throw new Error(payload?.message ?? "לא ניתן לטעון מוצרים");
    }

    setProducts(Array.isArray(payload?.products) ? payload.products : []);
  }, []);

  useEffect(() => {
    reloadProducts().catch((error) => {
      setStatusMessage(
        error instanceof Error ? error.message : "לא ניתן לטעון מוצרים"
      );
    });
  }, [reloadProducts]);

  const nextThemeLabel =
    theme === "dark" ? "למצב יום" : theme === "light" ? "למצב סגול" : "למצב לילה";

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + order.total, 0),
    [orders]
  );
  const activeProductsCount = useMemo(
    () => products.filter((product) => product.status === "active").length,
    [products]
  );
  const lowStockCount = useMemo(
    () => products.filter((product) => product.stock <= 20).length,
    [products]
  );
  const activeMembersCount = useMemo(
    () => members.filter((member) => member.status === "active").length,
    [members]
  );

  const handleLogout = async () => {
    await logout();
    router.push("/admin/login");
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, status } : order))
    );
    setStatusMessage(`סטטוס הזמנה ${id} עודכן ל-${resolveOrderStatusLabel(status)}.`);
  };

  const toggleMemberTier = (id: string) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.id === id
          ? {
              ...member,
              tier: member.tier === "vip" ? "regular" : "vip"
            }
          : member
      )
    );
  };

  const toggleMemberStatus = (id: string) => {
    setMembers((prev) =>
      prev.map((member) =>
        member.id === id
          ? {
              ...member,
              status: member.status === "active" ? "frozen" : "active"
            }
          : member
      )
    );
  };

  return (
    <div className="min-h-screen bg-club-black text-club-white">
      <header className="sticky top-0 z-50 border-b border-club-darkGray bg-club-black/95 backdrop-blur">
        <div className="club-shell flex min-h-[84px] items-center justify-between gap-4 py-3">
          <div>
            <p className="club-kicker">ADMIN CONSOLE</p>
            <h1 className="mt-1 text-xl font-medium tracking-wide">פאנל ניהול מלא</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg border border-club-darkGray px-4 py-2 text-sm text-club-lightGray hover:border-club-white hover:text-club-white"
            >
              {nextThemeLabel}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-club-darkGray px-4 py-2 text-sm text-club-lightGray hover:border-club-white hover:text-club-white"
            >
              יציאת אדמין
            </button>
          </div>
        </div>
      </header>

      <main className="club-shell py-8 sm:py-10">
        <section className="club-panel p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("dashboard")}
              className={`rounded-lg border px-4 py-2 text-sm ${
                activeTab === "dashboard"
                  ? "border-club-white bg-club-white text-club-black"
                  : "border-club-darkGray text-club-lightGray hover:border-club-white hover:text-club-white"
              }`}
            >
              דשבורד
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("products")}
              className={`rounded-lg border px-4 py-2 text-sm ${
                activeTab === "products"
                  ? "border-club-white bg-club-white text-club-black"
                  : "border-club-darkGray text-club-lightGray hover:border-club-white hover:text-club-white"
              }`}
            >
              ניהול מוצרים
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`rounded-lg border px-4 py-2 text-sm ${
                activeTab === "orders"
                  ? "border-club-white bg-club-white text-club-black"
                  : "border-club-darkGray text-club-lightGray hover:border-club-white hover:text-club-white"
              }`}
            >
              ניהול הזמנות
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("members")}
              className={`rounded-lg border px-4 py-2 text-sm ${
                activeTab === "members"
                  ? "border-club-white bg-club-white text-club-black"
                  : "border-club-darkGray text-club-lightGray hover:border-club-white hover:text-club-white"
              }`}
            >
              חברי מועדון
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("settings")}
              className={`rounded-lg border px-4 py-2 text-sm ${
                activeTab === "settings"
                  ? "border-club-white bg-club-white text-club-black"
                  : "border-club-darkGray text-club-lightGray hover:border-club-white hover:text-club-white"
              }`}
            >
              הגדרות מערכת
            </button>
          </div>
        </section>

        {statusMessage ? (
          <p className="mt-4 rounded-lg border border-club-darkGray bg-club-panel px-4 py-3 text-sm text-club-lightGray">
            {statusMessage}
          </p>
        ) : null}

        {activeTab === "dashboard" ? (
          <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="club-card p-5">
              <p className="text-xs tracking-[0.18em] text-club-lightGray">סך מוצרים</p>
              <p className="mt-3 text-3xl font-medium">{products.length}</p>
            </article>
            <article className="club-card p-5">
              <p className="text-xs tracking-[0.18em] text-club-lightGray">מוצרים פעילים</p>
              <p className="mt-3 text-3xl font-medium">{activeProductsCount}</p>
            </article>
            <article className="club-card p-5">
              <p className="text-xs tracking-[0.18em] text-club-lightGray">סך הזמנות</p>
              <p className="mt-3 text-3xl font-medium">{orders.length}</p>
            </article>
            <article className="club-card p-5">
              <p className="text-xs tracking-[0.18em] text-club-lightGray">הכנסות יומיות</p>
              <p className="mt-3 text-3xl font-medium">{formatPrice(totalRevenue)}</p>
            </article>
            <article className="club-card p-5 sm:col-span-2">
              <p className="text-xs tracking-[0.18em] text-club-lightGray">התראות מלאי</p>
              <p className="mt-3 text-sm text-club-white">
                {lowStockCount > 0
                  ? `${lowStockCount} מוצרים דורשים חידוש מלאי (מתחת ל-20 יחידות).`
                  : "אין התראות מלאי כרגע."}
              </p>
            </article>
            <article className="club-card p-5 sm:col-span-2">
              <p className="text-xs tracking-[0.18em] text-club-lightGray">חברי מועדון פעילים</p>
              <p className="mt-3 text-3xl font-medium">{activeMembersCount}</p>
              <p className="mt-2 text-sm text-club-lightGray">
                סה״כ חברים במערכת: {members.length}
              </p>
            </article>
          </section>
        ) : null}

        {activeTab === "products" ? (
          <AdminProductsTab
            products={products}
            setProducts={setProducts}
            onStatusMessage={setStatusMessage}
            reloadProducts={reloadProducts}
          />
        ) : null}

        {activeTab === "orders" ? (
          <section className="mt-6">
            <article className="club-panel overflow-x-auto p-4 sm:p-6">
              <h2 className="mb-4 text-2xl font-medium">ניהול הזמנות בזמן אמת</h2>
              <table className="w-full min-w-[840px] text-right text-sm">
                <thead>
                  <tr className="border-b border-club-darkGray text-club-lightGray">
                    <th className="px-2 py-3 font-normal">מס׳ הזמנה</th>
                    <th className="px-2 py-3 font-normal">לקוח</th>
                    <th className="px-2 py-3 font-normal">ערוץ</th>
                    <th className="px-2 py-3 font-normal">פריטים</th>
                    <th className="px-2 py-3 font-normal">סכום</th>
                    <th className="px-2 py-3 font-normal">תאריך</th>
                    <th className="px-2 py-3 font-normal">סטטוס</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-club-darkGray/60">
                      <td className="px-2 py-3">{order.id}</td>
                      <td className="px-2 py-3">{order.customer}</td>
                      <td className="px-2 py-3 text-club-lightGray">{order.channel}</td>
                      <td className="px-2 py-3">{order.items}</td>
                      <td className="px-2 py-3">{formatPrice(order.total)}</td>
                      <td className="px-2 py-3 text-club-lightGray">{order.createdAt}</td>
                      <td className="px-2 py-3">
                        <select
                          value={order.status}
                          onChange={(event) =>
                            updateOrderStatus(order.id, event.target.value as OrderStatus)
                          }
                          className="club-select h-9 min-w-[140px]"
                        >
                          <option value="new">חדש</option>
                          <option value="confirmed">אושר</option>
                          <option value="packed">באריזה</option>
                          <option value="delivered">נמסר</option>
                          <option value="cancelled">בוטל</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </section>
        ) : null}

        {activeTab === "members" ? (
          <section className="mt-6">
            <article className="club-panel overflow-x-auto p-4 sm:p-6">
              <h2 className="mb-4 text-2xl font-medium">ניהול חברי מועדון</h2>
              <table className="w-full min-w-[820px] text-right text-sm">
                <thead>
                  <tr className="border-b border-club-darkGray text-club-lightGray">
                    <th className="px-2 py-3 font-normal">שם</th>
                    <th className="px-2 py-3 font-normal">אימייל</th>
                    <th className="px-2 py-3 font-normal">רמה</th>
                    <th className="px-2 py-3 font-normal">סטטוס</th>
                    <th className="px-2 py-3 font-normal">רכישה אחרונה</th>
                    <th className="px-2 py-3 font-normal">פעולות</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id} className="border-b border-club-darkGray/60">
                      <td className="px-2 py-3">{member.name}</td>
                      <td className="px-2 py-3 text-club-lightGray">{member.email}</td>
                      <td className="px-2 py-3">{member.tier === "vip" ? "VIP" : "רגיל"}</td>
                      <td className="px-2 py-3">{member.status === "active" ? "פעיל" : "מוקפא"}</td>
                      <td className="px-2 py-3 text-club-lightGray">{member.lastPurchase}</td>
                      <td className="px-2 py-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => toggleMemberTier(member.id)}
                            className="rounded-md border border-club-darkGray px-3 py-1 text-xs text-club-lightGray hover:border-club-white hover:text-club-white"
                          >
                            {member.tier === "vip" ? "העבר לרגיל" : "העבר ל-VIP"}
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleMemberStatus(member.id)}
                            className="rounded-md border border-club-darkGray px-3 py-1 text-xs text-club-lightGray hover:border-club-white hover:text-club-white"
                          >
                            {member.status === "active" ? "הקפא" : "הפעל"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </section>
        ) : null}

        {activeTab === "settings" ? (
          <section className="mt-6">
            <article className="club-panel p-6">
              <h2 className="text-2xl font-medium">הגדרות מערכת</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-club-lightGray">שם עסק</span>
                  <input
                    value={settings.businessName}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, businessName: event.target.value }))
                    }
                    className="club-field h-11"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-club-lightGray">וואטסאפ הזמנות</span>
                  <input
                    value={settings.whatsappNumber}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, whatsappNumber: event.target.value }))
                    }
                    className="club-field h-11"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-club-lightGray">טלגרם</span>
                  <input
                    value={settings.telegramHandle}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, telegramHandle: event.target.value }))
                    }
                    className="club-field h-11"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-club-lightGray">שעות פעילות</span>
                  <input
                    value={settings.supportHours}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, supportHours: event.target.value }))
                    }
                    className="club-field h-11"
                  />
                </label>
              </div>

              <label className="mt-4 block space-y-2">
                <span className="text-sm text-club-lightGray">הודעת מערכת</span>
                <textarea
                  value={settings.announcement}
                  onChange={(event) =>
                    setSettings((prev) => ({ ...prev, announcement: event.target.value }))
                  }
                  className="club-field min-h-[100px] py-3"
                />
              </label>

              <label className="mt-4 flex items-center gap-3 text-sm text-club-lightGray">
                <input
                  type="checkbox"
                  checked={settings.allowAnonymousCatalog}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      allowAnonymousCatalog: event.target.checked
                    }))
                  }
                />
                אפשר גישה לקטלוג אנונימי
              </label>

              <button
                type="button"
                onClick={() => setStatusMessage("הגדרות המערכת נשמרו בהצלחה.")}
                className="club-btn-primary mt-6 w-full sm:w-auto"
              >
                שמור הגדרות
              </button>
            </article>
          </section>
        ) : null}
      </main>
    </div>
  );
}
