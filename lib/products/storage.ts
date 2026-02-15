import "server-only";

import fs from "node:fs/promises";
import path from "node:path";
import { Product } from "@/lib/products/types";

const PRODUCTS_FILE_PATH = path.join(process.cwd(), "data", "products.json");

export async function readProducts(): Promise<Product[]> {
  try {
    const raw = await fs.readFile(PRODUCTS_FILE_PATH, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed as Product[];
  } catch (error) {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return [];
    }
    throw error;
  }
}

export async function writeProducts(products: Product[]) {
  await fs.mkdir(path.dirname(PRODUCTS_FILE_PATH), { recursive: true });
  await fs.writeFile(PRODUCTS_FILE_PATH, `${JSON.stringify(products, null, 2)}\n`, "utf8");
}

