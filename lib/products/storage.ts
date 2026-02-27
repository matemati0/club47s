import "server-only";

import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { Product, ProductOption, ProductStatus } from "@/lib/products/types";

type SqliteStatement = {
  all: (...params: unknown[]) => unknown[];
  get: (...params: unknown[]) => unknown;
  run: (...params: unknown[]) => unknown;
};

type SqliteTransactionFactory = <T extends (...args: any[]) => unknown>(fn: T) => T;

type SqliteDatabase = {
  exec: (sql: string) => void;
  prepare: (sql: string) => SqliteStatement;
  transaction: SqliteTransactionFactory;
};

type SqliteDatabaseCtor = new (filename: string) => SqliteDatabase;

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite") as {
  DatabaseSync: SqliteDatabaseCtor;
};

const LEGACY_PRODUCTS_FILE_PATH = path.join(process.cwd(), "data", "products.json");
const DEFAULT_PRODUCTS_DB_PATH = path.join(process.cwd(), "data", "products.db");

function resolveProductsDbPath() {
  const configured = process.env.PRODUCTS_DB_PATH?.trim();
  if (!configured) {
    return DEFAULT_PRODUCTS_DB_PATH;
  }

  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

const PRODUCTS_DB_PATH = resolveProductsDbPath();

let database: SqliteDatabase | null = null;
let initializationPromise: Promise<void> | null = null;

type ProductRow = {
  id: string;
  section: string;
  name: string;
  details_json: string;
  options_json: string;
  image_src: string | null;
  image_alt: string | null;
  stock: number | null;
  status: string | null;
  updated_at: string | null;
  sort_order: number | null;
};

function getDatabase() {
  if (database) {
    return database;
  }

  database = new DatabaseSync(PRODUCTS_DB_PATH);
  return database;
}

function normalizeStatus(status: unknown): ProductStatus {
  return status === "hidden" ? "hidden" : "active";
}

function normalizeUpdatedAt(value: unknown) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return new Date().toISOString();
  }

  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return new Date().toISOString();
  }

  return new Date(parsed).toISOString();
}

function parseDetails(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
}

function parseOptions(raw: unknown): ProductOption[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is { label?: unknown; price?: unknown } => {
      return typeof item === "object" && item !== null;
    })
    .map((item) => ({
      label: typeof item.label === "string" ? item.label.trim() : "",
      price: typeof item.price === "number" ? item.price : Number(item.price)
    }))
    .filter(
      (item) => item.label.length > 0 && Number.isFinite(item.price) && item.price > 0
    );
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function rowToProduct(row: ProductRow): Product {
  const parsedDetails = parseDetails(safeJsonParse(row.details_json));
  const parsedOptions = parseOptions(safeJsonParse(row.options_json));

  return {
    id: row.id,
    section: row.section,
    name: row.name,
    details: parsedDetails,
    options: parsedOptions,
    imageSrc: row.image_src ?? undefined,
    imageAlt: row.image_alt ?? undefined,
    stock: Number.isFinite(Number(row.stock)) ? Number(row.stock) : 0,
    status: normalizeStatus(row.status),
    updatedAt: normalizeUpdatedAt(row.updated_at)
  };
}

function normalizeProduct(input: Product, index: number): Product {
  return {
    id: input.id,
    section: input.section,
    name: input.name,
    details: parseDetails(input.details),
    options: parseOptions(input.options),
    imageSrc: input.imageSrc?.trim() ? input.imageSrc : undefined,
    imageAlt: input.imageAlt?.trim() ? input.imageAlt : undefined,
    stock: Number.isFinite(input.stock) ? Math.max(0, Math.trunc(input.stock)) : 0,
    status: normalizeStatus(input.status),
    updatedAt: normalizeUpdatedAt(input.updatedAt || new Date(Date.now() + index).toISOString())
  };
}

function createSchemaIfNeeded(db: SqliteDatabase) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      section TEXT NOT NULL,
      name TEXT NOT NULL,
      details_json TEXT NOT NULL,
      options_json TEXT NOT NULL,
      image_src TEXT,
      image_alt TEXT,
      stock INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
      updated_at TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `);

  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order ASC);"
  );
}

async function readLegacyProductsFile(): Promise<Product[]> {
  try {
    const raw = await fs.readFile(LEGACY_PRODUCTS_FILE_PATH, "utf8");
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

function replaceAllProducts(db: SqliteDatabase, products: Product[]) {
  const removeAllStmt = "DELETE FROM products;";
  const insertStmt = db.prepare(`
    INSERT INTO products (
      id,
      section,
      name,
      details_json,
      options_json,
      image_src,
      image_alt,
      stock,
      status,
      updated_at,
      sort_order
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
  `);

  const transaction = db.transaction((nextProducts: Product[]) => {
    db.exec(removeAllStmt);

    nextProducts.forEach((product, index) => {
      const normalized = normalizeProduct(product, index);
      insertStmt.run(
        normalized.id,
        normalized.section,
        normalized.name,
        JSON.stringify(normalized.details),
        JSON.stringify(normalized.options),
        normalized.imageSrc ?? null,
        normalized.imageAlt ?? null,
        normalized.stock,
        normalized.status,
        normalized.updatedAt,
        index
      );
    });
  });

  transaction(products);
}

async function seedDatabaseFromLegacyJsonIfEmpty(db: SqliteDatabase) {
  const countRow = db.prepare("SELECT COUNT(*) AS total FROM products;").get() as
    | { total?: number | string | bigint }
    | undefined;

  const currentCount = Number(countRow?.total ?? 0);
  if (currentCount > 0) {
    return;
  }

  const legacyProducts = await readLegacyProductsFile();
  if (legacyProducts.length === 0) {
    return;
  }

  replaceAllProducts(db, legacyProducts);
}

async function initializeDatabaseIfNeeded() {
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    await fs.mkdir(path.dirname(PRODUCTS_DB_PATH), { recursive: true });

    const db = getDatabase();
    createSchemaIfNeeded(db);
    await seedDatabaseFromLegacyJsonIfEmpty(db);
  })();

  try {
    await initializationPromise;
  } catch (error) {
    initializationPromise = null;
    throw error;
  }
}

export async function readProducts(): Promise<Product[]> {
  await initializeDatabaseIfNeeded();

  const db = getDatabase();
  const rows = db
    .prepare(
      `
      SELECT
        id,
        section,
        name,
        details_json,
        options_json,
        image_src,
        image_alt,
        stock,
        status,
        updated_at,
        sort_order
      FROM products
      ORDER BY sort_order ASC, updated_at DESC;
      `
    )
    .all() as ProductRow[];

  return rows.map(rowToProduct);
}

export async function writeProducts(products: Product[]) {
  await initializeDatabaseIfNeeded();
  replaceAllProducts(getDatabase(), products);
}
