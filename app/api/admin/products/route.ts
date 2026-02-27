import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, resolveAuthMode } from "@/lib/auth";
import { readProducts, writeProducts } from "@/lib/products/storage";
import { ensureTrustedMutationOrigin } from "@/lib/security/requestOrigin";
import { Product } from "@/lib/products/types";
import { productCreateSchema } from "@/lib/validation/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAdminRequest(request: NextRequest) {
  return resolveAuthMode(request.cookies.get(AUTH_COOKIE_NAME)?.value).then(
    (mode) => mode === "admin"
  );
}

function generateProductId() {
  return `p-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
}

export async function GET(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const products = await readProducts();
  return NextResponse.json(
    { products },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

export async function POST(request: NextRequest) {
  if (!(await isAdminRequest(request))) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const originRejection = ensureTrustedMutationOrigin(request);
  if (originRejection) {
    return originRejection;
  }

  const body = (await request.json().catch(() => null)) as unknown;
  const parsed = productCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        message: "Invalid product payload",
        errors: parsed.error.flatten().fieldErrors
      },
      { status: 400 }
    );
  }

  const products = await readProducts();
  const id = parsed.data.id ?? generateProductId();

  if (products.some((product) => product.id === id)) {
    return NextResponse.json(
      {
        message: "Product id already exists"
      },
      { status: 409 }
    );
  }

  const now = new Date().toISOString();
  const nextProduct: Product = {
    id,
    section: parsed.data.section,
    name: parsed.data.name,
    details: parsed.data.details ?? [],
    options: parsed.data.options,
    imageSrc: parsed.data.imageSrc,
    imageAlt: parsed.data.imageAlt,
    stock: parsed.data.stock ?? 0,
    status: parsed.data.status ?? "active",
    updatedAt: now
  };

  await writeProducts([nextProduct, ...products]);
  return NextResponse.json({ product: nextProduct }, { status: 201 });
}
