"use client";

import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type { Product, ProductOption, ProductStatus } from "@/lib/products/types";

type ProductOptionDraft = {
  label: string;
  price: string;
};

type ProductFormState = {
  id: string;
  name: string;
  section: string;
  detailsText: string;
  options: ProductOptionDraft[];
  stock: string;
  status: ProductStatus;
  imageSrc: string;
  imageAlt: string;
  imageFile: File | null;
};

function formatPrice(value: number) {
  return `${value.toLocaleString("he-IL")} ₪`;
}

function formatProductPackages(options: ProductOption[]) {
  return options.map((item) => `${item.label}: ${formatPrice(item.price)}`).join(" | ");
}

function formatUpdatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString("he-IL");
}

function createEmptyFormState(): ProductFormState {
  return {
    id: "",
    name: "",
    section: "",
    detailsText: "",
    options: [{ label: "", price: "" }],
    stock: "0",
    status: "active",
    imageSrc: "",
    imageAlt: "",
    imageFile: null
  };
}

async function uploadProductImage(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/admin/uploads/product-image", {
    method: "POST",
    body: formData,
    cache: "no-store"
  });

  const payload = (await response.json().catch(() => null)) as
    | { path?: string; message?: string }
    | null;

  if (!response.ok || !payload?.path) {
    throw new Error(payload?.message ?? "העלאת התמונה נכשלה");
  }

  return payload.path;
}

function parseDetails(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseOptions(drafts: ProductOptionDraft[]): {
  options: ProductOption[];
  error?: string;
} {
  const options: ProductOption[] = [];

  for (const option of drafts) {
    const label = option.label.trim();
    const priceRaw = option.price.trim();

    if (!label && !priceRaw) {
      continue;
    }

    const price = Number(priceRaw);
    if (!label) {
      return { options: [], error: "יש למלא שם חבילה לכל שורה" };
    }
    if (!Number.isFinite(price) || price <= 0) {
      return { options: [], error: `מחיר לא תקין עבור: ${label}` };
    }

    options.push({ label, price });
  }

  if (options.length === 0) {
    return { options: [], error: "יש להוסיף לפחות חבילה אחת" };
  }

  return { options };
}

export function AdminProductsTab({
  products,
  setProducts,
  onStatusMessage,
  reloadProducts
}: {
  products: Product[];
  setProducts: Dispatch<SetStateAction<Product[]>>;
  onStatusMessage: (message: string) => void;
  reloadProducts: () => Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(() => createEmptyFormState());
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isReloading, setIsReloading] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const editingProduct = useMemo(
    () => (editingId ? products.find((product) => product.id === editingId) ?? null : null),
    [editingId, products]
  );

  useEffect(() => {
    if (!form.imageFile) {
      setImagePreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(form.imageFile);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [form.imageFile]);

  useEffect(() => {
    setFormError(null);

    if (!editingProduct) {
      setForm(createEmptyFormState());
      return;
    }

    setForm({
      id: editingProduct.id,
      name: editingProduct.name,
      section: editingProduct.section,
      detailsText: editingProduct.details.join("\n"),
      options: editingProduct.options.map((option) => ({
        label: option.label,
        price: String(option.price)
      })),
      stock: String(editingProduct.stock),
      status: editingProduct.status,
      imageSrc: editingProduct.imageSrc ?? "",
      imageAlt: editingProduct.imageAlt ?? "",
      imageFile: null
    });
  }, [editingProduct]);

  const editorTitle = editingId ? "עריכת מוצר" : "הוספת מוצר חדש";
  const imageSrc = imagePreviewUrl || form.imageSrc || "/products/default-product.svg";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const name = form.name.trim();
    const section = form.section.trim();

    if (!name) {
      setFormError("יש למלא שם מוצר");
      return;
    }
    if (!section) {
      setFormError("יש למלא קטגוריה");
      return;
    }

    const stock = Number(form.stock);
    if (!Number.isFinite(stock) || stock < 0) {
      setFormError("מלאי חייב להיות מספר 0 ומעלה");
      return;
    }

    const parsedOptions = parseOptions(form.options);
    if (parsedOptions.error) {
      setFormError(parsedOptions.error);
      return;
    }

    setIsSaving(true);
    try {
      const nextImageSrc = form.imageFile ? await uploadProductImage(form.imageFile) : form.imageSrc;

      const payload = {
        ...(editingId ? {} : form.id.trim() ? { id: form.id.trim() } : {}),
        name,
        section,
        details: parseDetails(form.detailsText),
        options: parsedOptions.options,
        stock: Math.floor(stock),
        status: form.status,
        imageSrc: nextImageSrc || undefined,
        imageAlt: form.imageAlt.trim() || undefined
      };

      const response = await fetch(
        editingId ? `/api/admin/products/${editingId}` : "/api/admin/products",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload),
          cache: "no-store"
        }
      );

      const data = (await response.json().catch(() => null)) as
        | { product?: Product; message?: string }
        | null;

      if (!response.ok || !data?.product) {
        throw new Error(data?.message ?? "שמירת המוצר נכשלה");
      }

      if (editingId) {
        setProducts((prev) => prev.map((p) => (p.id === data.product?.id ? data.product : p)));
        onStatusMessage("המוצר עודכן בהצלחה.");
      } else {
        setProducts((prev) => [data.product as Product, ...prev]);
        onStatusMessage("מוצר חדש נוסף בהצלחה.");
      }

      setEditingId(null);
      setForm(createEmptyFormState());
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError("אירעה שגיאה בשמירת המוצר");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    setFormError(null);

    const nextStatus: ProductStatus = product.status === "active" ? "hidden" : "active";
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: nextStatus }),
        cache: "no-store"
      });

      const data = (await response.json().catch(() => null)) as
        | { product?: Product; message?: string }
        | null;
      if (!response.ok || !data?.product) {
        throw new Error(data?.message ?? "עדכון סטטוס נכשל");
      }

      setProducts((prev) => prev.map((p) => (p.id === product.id ? data.product as Product : p)));
      onStatusMessage(nextStatus === "active" ? "המוצר הופעל." : "המוצר הוסתר.");
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError("אירעה שגיאה בעדכון סטטוס");
      }
    }
  };

  const handleDelete = async (product: Product) => {
    setFormError(null);

    if (!confirm(`למחוק את "${product.name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "DELETE",
        cache: "no-store"
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(payload?.message ?? "מחיקה נכשלה");
      }

      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      if (editingId === product.id) {
        setEditingId(null);
      }
      onStatusMessage("המוצר נמחק.");
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError("אירעה שגיאה במחיקה");
      }
    }
  };

  const handleReload = async () => {
    setFormError(null);
    setIsReloading(true);
    try {
      await reloadProducts();
      onStatusMessage("הרשימה עודכנה.");
    } catch (error) {
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError("לא ניתן לטעון מוצרים");
      }
    } finally {
      setIsReloading(false);
    }
  };

  return (
    <section className="mt-6 space-y-6">
      <article className="club-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-2xl font-medium">{editorTitle}</h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setForm(createEmptyFormState());
                setFormError(null);
              }}
              className="club-btn-secondary h-11"
            >
              מוצר חדש
            </button>
            <button
              type="button"
              onClick={handleReload}
              disabled={isReloading}
              className="club-btn-secondary h-11 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isReloading ? "טוען..." : "רענן רשימה"}
            </button>
          </div>
        </div>

        {formError ? (
          <p className="mt-4 rounded-lg border border-club-darkGray bg-club-card px-4 py-3 text-sm text-club-lightGray">
            {formError}
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
          <div className="grid gap-4 lg:grid-cols-[160px_minmax(0,1fr)]">
            <div className="flex items-start justify-center">
              <div className="relative h-[140px] w-[140px] overflow-hidden rounded-xl border border-club-darkGray bg-club-panel">
                <Image src={imageSrc} alt={form.imageAlt || form.name || "תמונת מוצר"} fill className="object-cover" />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-club-lightGray">מזהה מוצר</span>
                <input
                  value={form.id}
                  onChange={(event) => setForm((prev) => ({ ...prev, id: event.target.value }))}
                  placeholder="לדוגמה: cenforce-250"
                  className="club-field h-11"
                  readOnly={Boolean(editingId)}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm text-club-lightGray">סטטוס</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, status: event.target.value as ProductStatus }))
                  }
                  className="club-select h-11 w-full"
                >
                  <option value="active">פעיל</option>
                  <option value="hidden">מוסתר</option>
                </select>
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm text-club-lightGray">שם מוצר</span>
                <input
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="שם מוצר"
                  className="club-field h-11"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm text-club-lightGray">קטגוריה</span>
                <input
                  value={form.section}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, section: event.target.value }))
                  }
                  placeholder="מוצרים לנשים / מוצרים לגברים..."
                  className="club-field h-11"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm text-club-lightGray">מלאי</span>
                <input
                  type="number"
                  value={form.stock}
                  onChange={(event) => setForm((prev) => ({ ...prev, stock: event.target.value }))}
                  className="club-field h-11"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm text-club-lightGray">ALT לתמונה</span>
                <input
                  value={form.imageAlt}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, imageAlt: event.target.value }))
                  }
                  placeholder="טקסט תיאור לתמונה (לא חובה)"
                  className="club-field h-11"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm text-club-lightGray">תמונה</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      imageFile: event.target.files?.[0] ?? null
                    }))
                  }
                  className="club-field h-11 py-2"
                />
                <p className="text-xs text-club-lightGray">
                  העלאה תישמר ל-<span className="font-mono">/public/uploads/products</span>
                </p>
              </label>
            </div>
          </div>

          <label className="space-y-2">
            <span className="text-sm text-club-lightGray">תיאור (שורה לכל בולט)</span>
            <textarea
              value={form.detailsText}
              onChange={(event) => setForm((prev) => ({ ...prev, detailsText: event.target.value }))}
              className="club-field min-h-[110px] py-3"
              placeholder={"לדוגמה:\nהשפעה ארוכת טווח\nמשלוח דיסקרטי"}
            />
          </label>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-club-lightGray">חבילות ומחירים</p>
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    options: [...prev.options, { label: "", price: "" }]
                  }))
                }
                className="rounded-md border border-club-darkGray px-3 py-2 text-xs text-club-lightGray hover:border-club-white hover:text-club-white"
              >
                הוסף חבילה
              </button>
            </div>

            <div className="grid gap-3">
              {form.options.map((option, index) => (
                <div key={`option-${index}`} className="grid gap-2 sm:grid-cols-[1fr_180px_92px]">
                  <input
                    value={option.label}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        options: prev.options.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, label: event.target.value } : item
                        )
                      }))
                    }
                    placeholder="שם חבילה (למשל 10 כדורים)"
                    className="club-field h-11"
                  />
                  <input
                    type="number"
                    value={option.price}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        options: prev.options.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, price: event.target.value } : item
                        )
                      }))
                    }
                    placeholder="מחיר"
                    className="club-field h-11"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        options:
                          prev.options.length === 1
                            ? prev.options
                            : prev.options.filter((_, itemIndex) => itemIndex !== index)
                      }))
                    }
                    className="rounded-lg border border-club-darkGray px-3 py-2 text-sm text-club-lightGray hover:border-club-white hover:text-club-white"
                  >
                    הסר
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="club-btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "שומר..." : editingId ? "שמור שינויים" : "הוסף מוצר"}
          </button>
        </form>
      </article>

      <article className="club-panel overflow-x-auto p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-medium">רשימת מוצרים</h2>
          <p className="text-sm text-club-lightGray">סה״כ: {products.length}</p>
        </div>

        <table className="mt-4 w-full min-w-[1080px] text-right text-sm">
          <thead>
            <tr className="border-b border-club-darkGray text-club-lightGray">
              <th className="px-2 py-3 font-normal">תמונה</th>
              <th className="px-2 py-3 font-normal">מוצר</th>
              <th className="px-2 py-3 font-normal">קטגוריה</th>
              <th className="px-2 py-3 font-normal">חבילות ומחירים</th>
              <th className="px-2 py-3 font-normal">מלאי</th>
              <th className="px-2 py-3 font-normal">סטטוס</th>
              <th className="px-2 py-3 font-normal">עודכן</th>
              <th className="px-2 py-3 font-normal">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const rowImage = product.imageSrc || "/products/default-product.svg";
              return (
                <tr key={product.id} className="border-b border-club-darkGray/60 align-top">
                  <td className="px-2 py-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-club-darkGray bg-club-panel">
                      <Image src={rowImage} alt={product.imageAlt ?? product.name} fill sizes="48px" className="object-cover" />
                    </div>
                  </td>
                  <td className="px-2 py-3">
                    <p className="text-club-white">{product.name}</p>
                    <p className="mt-1 text-xs text-club-lightGray">{product.id}</p>
                  </td>
                  <td className="px-2 py-3 text-club-lightGray">{product.section}</td>
                  <td className="px-2 py-3 text-club-lightGray">
                    {formatProductPackages(product.options)}
                  </td>
                  <td className="px-2 py-3">{product.stock}</td>
                  <td className="px-2 py-3">{product.status === "active" ? "פעיל" : "מוסתר"}</td>
                  <td className="px-2 py-3 text-club-lightGray">{formatUpdatedAt(product.updatedAt)}</td>
                  <td className="px-2 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(product.id)}
                        className="rounded-md border border-club-darkGray px-3 py-1 text-xs text-club-lightGray hover:border-club-white hover:text-club-white"
                      >
                        ערוך
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(product)}
                        className="rounded-md border border-club-darkGray px-3 py-1 text-xs text-club-lightGray hover:border-club-white hover:text-club-white"
                      >
                        {product.status === "active" ? "הסתר" : "הפעל"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        className="rounded-md border border-club-darkGray px-3 py-1 text-xs text-club-lightGray hover:border-club-white hover:text-club-white"
                      >
                        מחק
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </article>
    </section>
  );
}
