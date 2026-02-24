"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import seedProducts from "@/data/products.json";
import type { Product } from "@/lib/products/types";

type CartItem = {
  key: string;
  productName: string;
  optionLabel: string;
  unitPrice: number;
  quantity: number;
};

type StoreMode = "anonymous" | "member";

const WHATSAPP_PHONE = process.env.NEXT_PUBLIC_WHATSAPP_PHONE ?? "972539195024";
const TELEGRAM_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_USERNAME ?? "sodot_service";
const DEFAULT_PRODUCT_IMAGE = "/products/default-product.svg";

const memberHighlights = [
  {
    title: "סטטוס חשבון",
    description: "חשבון החבר שלך פעיל ומאומת."
  },
  {
    title: "הטבת חברים חודשית",
    description: "החודש זמינה הטבה בלעדית על מוצרים מובילים."
  },
  {
    title: "שירות דיסקרטי",
    description: "אריזה אנונימית ומשלוח מהיר בכל הארץ."
  }
];

const memberUpdates = [
  "נוספו מוצרים חדשים לקטגוריית קאמגרה ג׳לי ומדבקות.",
  "זמני המשלוח עודכנו ל-24-72 שעות ברוב אזורי הארץ.",
  "מערכת ההזמנות הישירה בעגלה פעילה לכלל חברי המועדון."
];

const fallbackProducts = seedProducts as Product[];

const sectionsOrder = [
  "מוצרים לנשים",
  "מוצרים לגברים – טבליות וכדורים",
  "מוצרים לגברים – ג'לי ומדבקות",
  "מוצרים משותפים – לגברים ולנשים"
];

function formatPrice(value: number) {
  return `${value.toLocaleString("he-IL")} ₪`;
}

function buildOrderMessage(items: CartItem[], totalPrice: number, introLine: string) {
  if (items.length === 0) {
    return introLine;
  }

  const lines = [
    introLine,
    ...items.map(
      (item, index) =>
        `${index + 1}. ${item.productName} | ${item.optionLabel} | כמות: ${item.quantity} | סה״כ שורה: ${formatPrice(item.quantity * item.unitPrice)}`
    ),
    `סה״כ לתשלום: ${formatPrice(totalPrice)}`
  ];

  return lines.join("\n");
}

function buildWhatsAppUrl(message: string) {
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}

function buildTelegramUrl(message: string) {
  return `https://t.me/${TELEGRAM_USERNAME}?text=${encodeURIComponent(message)}`;
}

function getStoreCopy(mode: StoreMode) {
  if (mode === "member") {
    return {
      kicker: "תפריט חברי מועדון",
      title: "קטלוג חברים פרטי",
      subtitle: "מוצרים נבחרים להזמנה מהירה במסלול חברים מאומת.",
      meta: "כרטיסי מוצר | דרופדאון חבילות | סל קניות עם סיכום פריטים",
      orderIntro: "שלום, אני חבר מועדון ומעוניין לבצע הזמנה מ-Club47:",
      cartTitle: "סל קניות לחבר"
    };
  }

  return {
    kicker: "קטלוג אנונימי",
    title: "קטלוג Club47",
    subtitle: "מוצרים איכותיים בדיסקרטיות מלאה, להזמנה מהירה ובטוחה.",
    meta: "איכות גבוהה | שירות דיסקרטי | משלוחים מהירים",
    orderIntro: "שלום, אני מעוניין לבצע הזמנה מ-Club47:",
    cartTitle: "סל קניות"
  };
}

function StoreCatalog({ mode }: { mode: StoreMode }) {
  const copy = getStoreCopy(mode);
  const [products, setProducts] = useState<Product[]>(fallbackProducts);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await fetch("/api/products", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const payload = (await response.json().catch(() => null)) as
          | { products?: Product[] }
          | null;

        if (!cancelled && Array.isArray(payload?.products)) {
          setProducts(payload.products);
        }
      } catch {
        // Keep fallback catalog.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const groupedProducts = useMemo(() => {
    const availableSections = Array.from(new Set(products.map((product) => product.section)));
    const extraSections = availableSections.filter(
      (section) => !sectionsOrder.includes(section)
    );

    const orderedSections = [
      ...sectionsOrder,
      ...extraSections.sort((a, b) => a.localeCompare(b, "he-IL"))
    ];

    return orderedSections
      .map((sectionTitle) => ({
        title: sectionTitle,
        products: products.filter((product) => product.section === sectionTitle)
      }))
      .filter((section) => section.products.length > 0);
  }, [products]);

  const [selectedOptionIndex, setSelectedOptionIndex] = useState<Record<string, number>>({});
  const [selectedQuantity, setSelectedQuantity] = useState<Record<string, number>>({});
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const totalPrice = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    [cartItems]
  );
  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const orderMessage = useMemo(
    () => buildOrderMessage(cartItems, totalPrice, copy.orderIntro),
    [cartItems, copy.orderIntro, totalPrice]
  );

  const whatsappOrderUrl = useMemo(() => buildWhatsAppUrl(orderMessage), [orderMessage]);
  const telegramOrderUrl = useMemo(() => buildTelegramUrl(orderMessage), [orderMessage]);

  useEffect(() => {
    if (!isCartOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCartOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isCartOpen]);

  const handleAddToCart = (product: Product) => {
    const optionIndex = selectedOptionIndex[product.id] ?? 0;
    const quantity = selectedQuantity[product.id] ?? 1;
    const selectedOption = product.options[optionIndex];
    const itemKey = `${product.id}:${selectedOption.label}`;

    setCartItems((previous) => {
      const existing = previous.find((item) => item.key === itemKey);
      if (existing) {
        return previous.map((item) =>
          item.key === itemKey ? { ...item, quantity: item.quantity + quantity } : item
        );
      }

      return [
        ...previous,
        {
          key: itemKey,
          productName: product.name,
          optionLabel: selectedOption.label,
          unitPrice: selectedOption.price,
          quantity
        }
      ];
    });
  };

  const updateCartItemQuantity = (itemKey: string, nextQuantity: number) => {
    setCartItems((previous) => {
      if (nextQuantity <= 0) {
        return previous.filter((item) => item.key !== itemKey);
      }

      return previous.map((item) =>
        item.key === itemKey ? { ...item, quantity: nextQuantity } : item
      );
    });
  };

  return (
    <div className="grid items-start gap-10 lg:grid-cols-[1.15fr_0.85fr]">
      <section className="space-y-8 pb-28 lg:pb-0">
        <article className="club-panel p-7 sm:p-9 animate-fade">
          <p className="club-kicker">{copy.kicker}</p>
          <h3 className="club-title mt-4">{copy.title}</h3>
          <p className="club-subtitle mt-4">{copy.subtitle}</p>
          <p className="mt-2 text-sm tracking-wide text-club-lightGray">{copy.meta}</p>
        </article>

        {groupedProducts.map((section) => (
          <article
            key={section.title}
            className="club-panel p-6 sm:p-8 animate-fade"
          >
            <h4 className="text-2xl font-medium tracking-tight text-club-white">{section.title}</h4>
            <div className="mt-6 grid gap-5">
              {section.products.map((product) => {
                const activeOptionIndex = selectedOptionIndex[product.id] ?? 0;
                const activeQuantity = selectedQuantity[product.id] ?? 1;
                const activeOption = product.options[activeOptionIndex];
                const activeLinePrice = activeOption.price * activeQuantity;
                const imageSrc = product.imageSrc ?? DEFAULT_PRODUCT_IMAGE;

                return (
                  <div
                    key={product.id}
                    data-testid={`product-${product.id}`}
                    className="club-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-club-lightGray"
                  >
                    <div className="grid gap-4 sm:grid-cols-[88px_minmax(0,1fr)] sm:items-start">
                      <div className="relative h-[88px] w-[88px] overflow-hidden rounded-lg border border-club-darkGray bg-club-panel">
                        <Image
                          src={imageSrc}
                          alt={product.imageAlt ?? product.name}
                          fill
                          sizes="88px"
                          className="object-cover"
                        />
                      </div>

                      <div>
                        <h5 className="text-lg font-medium text-club-white">{product.name}</h5>
                        <ul className="mt-3 space-y-1 text-sm leading-relaxed text-club-lightGray">
                          {product.details.map((detail) => (
                            <li key={detail}>{detail}</li>
                          ))}
                        </ul>

                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          <label className="flex flex-col gap-2 text-xs tracking-wide text-club-lightGray">
                            בחירת חבילה ומחיר
                            <select
                              data-testid={`option-${product.id}`}
                              value={String(activeOptionIndex)}
                              onChange={(event) =>
                                setSelectedOptionIndex((previous) => ({
                                  ...previous,
                                  [product.id]: Number(event.target.value)
                                }))
                              }
                              className="club-select"
                            >
                              {product.options.map((option, optionIndex) => (
                                <option key={`${product.id}-${option.label}`} value={String(optionIndex)}>
                                  {option.label} - {formatPrice(option.price)}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="flex flex-col gap-2 text-xs tracking-wide text-club-lightGray">
                            כמות להזמנה
                            <select
                              data-testid={`qty-${product.id}`}
                              value={String(activeQuantity)}
                              onChange={(event) =>
                                setSelectedQuantity((previous) => ({
                                  ...previous,
                                  [product.id]: Number(event.target.value)
                                }))
                              }
                              className="club-select"
                            >
                              {Array.from({ length: 10 }).map((_, index) => (
                                <option key={`${product.id}-qty-${index + 1}`} value={String(index + 1)}>
                                  {index + 1}
                                </option>
                              ))}
                            </select>
                          </label>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                          <p className="text-sm text-club-white">
                            מחיר נבחר: <span className="font-medium">{formatPrice(activeLinePrice)}</span>
                          </p>
                          <button
                            type="button"
                            data-testid={`add-${product.id}`}
                            onClick={() => handleAddToCart(product)}
                            className="club-btn-primary h-10"
                          >
                            הוסף לעגלה
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </article>
        ))}

        <article className="club-panel p-6 sm:p-8 animate-fade">
          <h4 className="text-2xl font-medium tracking-wide text-club-white">משלוחים ותשלום</h4>
          <ul className="mt-6 space-y-2 text-sm text-club-lightGray">
            <li>משלוח דיסקרטי ומהיר בכל הארץ</li>
            <li>תשלום מאובטח מזומן או קריפטו</li>
            <li>אחריות מלאה</li>
            <li>שירות אישי</li>
          </ul>
          <p className="mt-6 text-base text-club-white">הזמנות בטלפון: 053-9195024</p>
        </article>
      </section>

      <aside
        className={`hidden lg:sticky lg:top-24 lg:block lg:self-start ${
          isCartOpen
            ? "block fixed inset-0 z-50 flex items-end justify-center bg-club-black/70 p-4 backdrop-blur-sm lg:static lg:bg-transparent lg:p-0 lg:backdrop-blur-0"
            : ""
        }`}
        onClick={isCartOpen ? () => setIsCartOpen(false) : undefined}
        aria-label="עגלה"
      >
        <div
          className={`club-panel w-full p-6 sm:p-8 animate-fade lg:h-fit ${
            isCartOpen ? "max-h-[85vh] max-w-xl overflow-auto" : ""
          }`}
          onClick={isCartOpen ? (event) => event.stopPropagation() : undefined}
        >
          <div className="flex items-start justify-between gap-4">
            <h4 className="text-2xl font-medium tracking-tight text-club-white">{copy.cartTitle}</h4>
            <button
              type="button"
              onClick={() => setIsCartOpen(false)}
              className="rounded-md border border-club-darkGray px-3 py-2 text-xs text-club-lightGray hover:border-club-white hover:text-club-white lg:hidden"
            >
              סגור
            </button>
          </div>

          <div className="club-card mt-4 p-4">
            <h5 className="text-sm tracking-[0.14em] text-club-lightGray">סיכום פריטים</h5>
            <div className="mt-3 space-y-2 text-sm text-club-lightGray">
              <p>שורות בעגלה: {cartItems.length}</p>
              <p data-testid="cart-count">כמות כוללת: {totalItems}</p>
              <p data-testid="cart-total" className="font-medium text-club-white">
                סה״כ לתשלום: {formatPrice(totalPrice)}
              </p>
            </div>
          </div>

          {cartItems.length === 0 ? (
            <p className="mt-6 text-sm text-club-lightGray">העגלה ריקה. בחר מוצר והוסף לעגלה.</p>
          ) : (
            <ul className="mt-6 space-y-4">
              {cartItems.map((item) => (
                <li key={item.key} className="club-card p-4">
                  <p className="text-sm font-medium text-club-white">{item.productName}</p>
                  <p className="mt-1 text-xs text-club-lightGray">{item.optionLabel}</p>
                  <p className="mt-2 text-sm text-club-white">{formatPrice(item.unitPrice)} ליחידה</p>
                  <p className="mt-1 text-xs text-club-lightGray">
                    סה״כ שורה: {formatPrice(item.unitPrice * item.quantity)}
                  </p>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateCartItemQuantity(item.key, item.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-club-darkGray text-sm text-club-white hover:border-club-white"
                        aria-label={`הפחתה עבור ${item.productName}`}
                      >
                        -
                      </button>
                      <span className="min-w-6 text-center text-sm text-club-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartItemQuantity(item.key, item.quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-md border border-club-darkGray text-sm text-club-white hover:border-club-white"
                        aria-label={`הוספה עבור ${item.productName}`}
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => updateCartItemQuantity(item.key, 0)}
                      className="text-xs text-club-lightGray transition-colors duration-200 hover:text-club-white"
                    >
                      הסר
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 border-t border-club-darkGray pt-4">
            <div className="grid gap-3">
              <a
                href={whatsappOrderUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => {
                  if (cartItems.length === 0) {
                    event.preventDefault();
                  }
                }}
                className="club-btn-primary w-full"
              >
                הזמנה בוואטסאפ
              </a>
              <a
                href={telegramOrderUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => {
                  if (cartItems.length === 0) {
                    event.preventDefault();
                  }
                }}
                className="club-btn-secondary w-full"
              >
                הזמנה בטלגרם
              </a>
              <button
                type="button"
                onClick={() => setCartItems([])}
                disabled={cartItems.length === 0}
                className="club-btn-secondary w-full disabled:cursor-not-allowed disabled:opacity-50"
              >
                נקה עגלה
              </button>
            </div>
          </div>
        </div>
      </aside>

      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-club-darkGray bg-club-black/95 backdrop-blur lg:hidden ${
          isCartOpen ? "hidden" : ""
        }`}
      >
        <div className="club-shell flex items-center justify-between gap-4 py-3">
          <div className="text-right">
            <p className="text-xs tracking-[0.14em] text-club-lightGray">סל קניות</p>
            <p className="mt-1 text-sm text-club-white">
              {totalItems} פריטים · {formatPrice(totalPrice)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            className="club-btn-primary h-10"
          >
            פתח עגלה
          </button>
        </div>
      </div>
    </div>
  );
}

export function MemberContent() {
  return (
    <div className="mt-10 space-y-8">
      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="club-panel p-6 sm:p-8 animate-fade">
          <h3 className="text-xl font-medium tracking-tight text-club-white">עדכונים פרטיים</h3>
          <div className="mt-6 grid gap-4">
            {memberHighlights.map((highlight) => (
              <article
                key={highlight.title}
                className="club-card px-4 py-5 transition-all duration-300 hover:-translate-y-1 hover:border-club-lightGray"
              >
                <h4 className="text-base font-medium text-club-white">{highlight.title}</h4>
                <p className="mt-2 text-sm text-club-lightGray">{highlight.description}</p>
              </article>
            ))}
          </div>
        </section>

        <aside className="club-panel p-6 sm:p-8 animate-fade">
          <h3 className="text-xl font-medium tracking-tight text-club-white">הודעות לחבר</h3>
          <ul className="mt-6 space-y-4">
            {memberUpdates.map((update) => (
              <li
                key={update}
                className="border-b border-club-darkGray pb-4 text-sm text-club-lightGray last:border-b-0 last:pb-0"
              >
                {update}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <StoreCatalog mode="member" />
    </div>
  );
}

export function AnonymousContent() {
  return (
    <div className="mt-10">
      <StoreCatalog mode="anonymous" />
    </div>
  );
}
