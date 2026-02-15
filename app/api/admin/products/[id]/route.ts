import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, resolveAuthMode } from "@/lib/auth";
import { readProducts, writeProducts } from "@/lib/products/storage";
import { Product } from "@/lib/products/types";
import { productUpdateSchema } from "@/lib/validation/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAdminRequest(request: NextRequest) {
  return resolveAuthMode(request.cookies.get(AUTH_COOKIE_NAME)?.value).then(
    (mode) => mode === "admin"
  );
}

function applyProductPatch(existing: Product, patch: unknown): Product {
  const parsed = productUpdateSchema.safeParse(patch);
  if (!parsed.success) {
    const error = new Error("Invalid product patch") as Error & {
      fieldErrors?: Record<string, string[]>;
    };
    error.fieldErrors = parsed.error.flatten().fieldErrors;
    throw error;
  }

  const next: Product = { ...existing, updatedAt: new Date().toISOString() };

  if (typeof parsed.data.section === "string") {
    next.section = parsed.data.section;
  }
  if (typeof parsed.data.name === "string") {
    next.name = parsed.data.name;
  }
  if (Array.isArray(parsed.data.details)) {
    next.details = parsed.data.details;
  }
  if (Array.isArray(parsed.data.options)) {
    next.options = parsed.data.options;
  }

  if (Object.prototype.hasOwnProperty.call(parsed.data, "imageSrc")) {
    next.imageSrc = parsed.data.imageSrc;
  }
  if (Object.prototype.hasOwnProperty.call(parsed.data, "imageAlt")) {
    next.imageAlt = parsed.data.imageAlt;
  }

  if (typeof parsed.data.stock === "number") {
    next.stock = parsed.data.stock;
  }
  if (parsed.data.status) {
    next.status = parsed.data.status;
  }

  return next;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const id = params.id;
  const body = (await request.json().catch(() => null)) as unknown;

  const products = await readProducts();
  const index = products.findIndex((product) => product.id === id);
  if (index < 0) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  try {
    const nextProduct = applyProductPatch(products[index] as Product, body);
    const nextProducts = products.slice();
    nextProducts[index] = nextProduct;
    await writeProducts(nextProducts);
    return NextResponse.json({ product: nextProduct });
  } catch (error) {
    if (error instanceof Error && "fieldErrors" in error) {
      return NextResponse.json(
        {
          message: error.message,
          errors: (error as { fieldErrors?: Record<string, string[]> }).fieldErrors
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ message: "Failed to update product" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const id = params.id;
  const products = await readProducts();
  const index = products.findIndex((product) => product.id === id);
  if (index < 0) {
    return NextResponse.json({ message: "Product not found" }, { status: 404 });
  }

  const nextProducts = products.filter((product) => product.id !== id);
  await writeProducts(nextProducts);
  return NextResponse.json({ ok: true });
}
