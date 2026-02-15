import { NextResponse } from "next/server";
import { readProducts } from "@/lib/products/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const products = await readProducts();
  const publicProducts = products.filter((product) => product.status === "active");

  return NextResponse.json(
    { products: publicProducts },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}

