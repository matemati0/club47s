import "server-only";

import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { Pool, type PoolConfig } from "pg";
import { Product, ProductOption, ProductStatus } from "@/lib/products/types";

type DbProvider = "postgres" | "sqlite";

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
  close?: () => void;
};

type SqliteDatabaseCtor = new (filename: string) => SqliteDatabase;

type SqliteProductRow = {
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

type PostgresProductRow = {
  id: string;
  section: string;
  name: string;
  details_json: unknown;
  options_json: unknown;
  image_src: string | null;
  image_alt: string | null;
  stock: number;
  status: string;
  updated_at: Date | string;
};

const LEGACY_PRODUCTS_FILE_PATH = path.join(process.cwd(), "data", "products.json");
const DEFAULT_SQLITE_DB_PATH = path.join(process.cwd(), "data", "products.db");
const SQLITE_DB_PATH = resolveSqliteDbPath();
const PRODUCTS_DATABASE_URL = resolveProductsDatabaseUrl();
const PRODUCTS_DB_PROVIDER = resolveProductsDbProvider();

let sqliteCtor: SqliteDatabaseCtor | null = null;
let sqliteDatabase: SqliteDatabase | null = null;
let sqliteInitializationPromise: Promise<void> | null = null;
let postgresInitializationPromise: Promise<void> | null = null;

if (process.env.NODE_ENV === "production" && PRODUCTS_DB_PROVIDER === "sqlite") {
  console.warn(
    "[products] Using SQLite in production. Configure PRODUCTS_DATABASE_URL (or DATABASE_URL) to use managed Postgres."
  );
}

function resolveProductsDbProvider(): DbProvider {
  const configured = process.env.PRODUCTS_DB_PROVIDER?.trim().toLowerCase();
  if (configured === "postgres" || configured === "sqlite") {
    return configured;
  }

  return PRODUCTS_DATABASE_URL ? "postgres" : "sqlite";
}

function resolveProductsDatabaseUrl() {
  const primary = process.env.PRODUCTS_DATABASE_URL?.trim();
  if (primary) {
    return primary;
  }

  return process.env.DATABASE_URL?.trim() ?? "";
}

function resolveSqliteDbPath() {
  const configured = process.env.PRODUCTS_DB_PATH?.trim();
  if (!configured) {
    return DEFAULT_SQLITE_DB_PATH;
  }

  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured);
}

function loadSqliteCtor() {
  if (sqliteCtor) {
    return sqliteCtor;
  }

  const require = createRequire(import.meta.url);
  const sqliteModule = require("node:sqlite") as { DatabaseSync: SqliteDatabaseCtor };
  sqliteCtor = sqliteModule.DatabaseSync;
  return sqliteCtor;
}

function getSqliteDatabase() {
  if (sqliteDatabase) {
    return sqliteDatabase;
  }

  const DatabaseSync = loadSqliteCtor();
  sqliteDatabase = new DatabaseSync(SQLITE_DB_PATH);
  return sqliteDatabase;
}

function resolvePostgresSslConfig() {
  const configured = process.env.PRODUCTS_DB_SSL?.trim().toLowerCase();
  const mode = configured ?? (process.env.NODE_ENV === "production" ? "require" : "disable");

  if (mode === "disable") {
    return false;
  }

  return {
    rejectUnauthorized: process.env.PRODUCTS_DB_SSL_REJECT_UNAUTHORIZED !== "false"
  };
}

function resolvePostgresPool() {
  if (!PRODUCTS_DATABASE_URL) {
    throw new Error(
      "Missing PRODUCTS_DATABASE_URL or DATABASE_URL for Postgres product storage."
    );
  }

  const maxConnections = Number(process.env.PRODUCTS_DB_MAX_CONNECTIONS ?? "10");
  const poolConfig: PoolConfig = {
    connectionString: PRODUCTS_DATABASE_URL,
    ssl: resolvePostgresSslConfig(),
    max:
      Number.isFinite(maxConnections) && maxConnections > 0
        ? Math.trunc(maxConnections)
        : 10
  };

  type GlobalWithPool = typeof globalThis & { __club47ProductsPool?: Pool };
  const globalForPool = globalThis as GlobalWithPool;

  if (!globalForPool.__club47ProductsPool) {
    globalForPool.__club47ProductsPool = new Pool(poolConfig);
  }

  return globalForPool.__club47ProductsPool;
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function normalizeStatus(status: unknown): ProductStatus {
  return status === "hidden" ? "hidden" : "active";
}

function normalizeUpdatedAt(value: unknown) {
  if (value instanceof Date) {
    return value.toISOString();
  }

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
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
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

function sqliteRowToProduct(row: SqliteProductRow): Product {
  return {
    id: row.id,
    section: row.section,
    name: row.name,
    details: parseDetails(safeJsonParse(row.details_json)),
    options: parseOptions(safeJsonParse(row.options_json)),
    imageSrc: row.image_src ?? undefined,
    imageAlt: row.image_alt ?? undefined,
    stock: Number.isFinite(Number(row.stock)) ? Number(row.stock) : 0,
    status: normalizeStatus(row.status),
    updatedAt: normalizeUpdatedAt(row.updated_at)
  };
}

function postgresRowToProduct(row: PostgresProductRow): Product {
  return {
    id: row.id,
    section: row.section,
    name: row.name,
    details: parseDetails(row.details_json),
    options: parseOptions(row.options_json),
    imageSrc: row.image_src ?? undefined,
    imageAlt: row.image_alt ?? undefined,
    stock: Number.isFinite(Number(row.stock)) ? Number(row.stock) : 0,
    status: normalizeStatus(row.status),
    updatedAt: normalizeUpdatedAt(row.updated_at)
  };
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

async function readProductsFromExistingSqliteFile(): Promise<Product[]> {
  try {
    await fs.access(SQLITE_DB_PATH);
  } catch {
    return [];
  }

  const DatabaseSync = loadSqliteCtor();
  const db = new DatabaseSync(SQLITE_DB_PATH);

  try {
    const tableExists = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='products' LIMIT 1;"
    ).get() as { name?: string } | undefined;

    if (!tableExists?.name) {
      return [];
    }

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
      .all() as SqliteProductRow[];

    return rows.map(sqliteRowToProduct);
  } catch {
    return [];
  } finally {
    db.close?.();
  }
}

function replaceAllProductsInSqlite(db: SqliteDatabase, products: Product[]) {
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
    db.exec("DELETE FROM products;");

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

function createSqliteSchemaIfNeeded(db: SqliteDatabase) {
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

async function initializeSqliteIfNeeded() {
  if (sqliteInitializationPromise) {
    return sqliteInitializationPromise;
  }

  sqliteInitializationPromise = (async () => {
    await fs.mkdir(path.dirname(SQLITE_DB_PATH), { recursive: true });

    const db = getSqliteDatabase();
    createSqliteSchemaIfNeeded(db);

    const countRow = db.prepare("SELECT COUNT(*) AS total FROM products;").get() as
      | { total?: number | string | bigint }
      | undefined;

    if (Number(countRow?.total ?? 0) > 0) {
      return;
    }

    const legacyProducts = await readLegacyProductsFile();
    if (legacyProducts.length > 0) {
      replaceAllProductsInSqlite(db, legacyProducts);
    }
  })();

  try {
    await sqliteInitializationPromise;
  } catch (error) {
    sqliteInitializationPromise = null;
    throw error;
  }
}

async function readProductsFromSqlite() {
  await initializeSqliteIfNeeded();

  const rows = getSqliteDatabase()
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
    .all() as SqliteProductRow[];

  return rows.map(sqliteRowToProduct);
}

async function writeProductsToSqlite(products: Product[]) {
  await initializeSqliteIfNeeded();
  replaceAllProductsInSqlite(getSqliteDatabase(), products);
}

async function createPostgresSchemaIfNeeded(pool: Pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      section TEXT NOT NULL,
      name TEXT NOT NULL,
      details_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      options_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      image_src TEXT,
      image_alt TEXT,
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden')),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sort_order INTEGER NOT NULL DEFAULT 0
    );
  `);

  await pool.query(
    "CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order ASC);"
  );
}

async function replaceAllProductsInPostgres(pool: Pool, products: Product[]) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM products;");

    for (let index = 0; index < products.length; index += 1) {
      const normalized = normalizeProduct(products[index] as Product, index);

      await client.query(
        `
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
        VALUES (
          $1,
          $2,
          $3,
          $4::jsonb,
          $5::jsonb,
          $6,
          $7,
          $8,
          $9,
          $10::timestamptz,
          $11
        );
        `,
        [
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
        ]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function seedPostgresIfEmpty(pool: Pool) {
  const countResult = await pool.query<{ total: number }>(
    "SELECT COUNT(*)::int AS total FROM products;"
  );

  if ((countResult.rows[0]?.total ?? 0) > 0) {
    return;
  }

  const sqliteProducts = await readProductsFromExistingSqliteFile();
  if (sqliteProducts.length > 0) {
    await replaceAllProductsInPostgres(pool, sqliteProducts);
    return;
  }

  const legacyProducts = await readLegacyProductsFile();
  if (legacyProducts.length > 0) {
    await replaceAllProductsInPostgres(pool, legacyProducts);
  }
}

async function initializePostgresIfNeeded() {
  if (postgresInitializationPromise) {
    return postgresInitializationPromise;
  }

  postgresInitializationPromise = (async () => {
    const pool = resolvePostgresPool();
    await createPostgresSchemaIfNeeded(pool);
    await seedPostgresIfEmpty(pool);
  })();

  try {
    await postgresInitializationPromise;
  } catch (error) {
    postgresInitializationPromise = null;
    throw error;
  }
}

async function readProductsFromPostgres() {
  await initializePostgresIfNeeded();

  const pool = resolvePostgresPool();
  const result = await pool.query<PostgresProductRow>(
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
      updated_at
    FROM products
    ORDER BY sort_order ASC, updated_at DESC;
    `
  );

  return result.rows.map(postgresRowToProduct);
}

async function writeProductsToPostgres(products: Product[]) {
  await initializePostgresIfNeeded();
  await replaceAllProductsInPostgres(resolvePostgresPool(), products);
}

export async function readProducts(): Promise<Product[]> {
  if (PRODUCTS_DB_PROVIDER === "postgres") {
    return readProductsFromPostgres();
  }

  return readProductsFromSqlite();
}

export async function writeProducts(products: Product[]) {
  if (PRODUCTS_DB_PROVIDER === "postgres") {
    await writeProductsToPostgres(products);
    return;
  }

  await writeProductsToSqlite(products);
}

