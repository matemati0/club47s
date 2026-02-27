import "server-only";

import crypto from "node:crypto";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { promisify } from "node:util";
import { Pool, type PoolConfig } from "pg";

type DbProvider = "postgres" | "sqlite";

type SqliteStatement = {
  get: (...params: unknown[]) => unknown;
  run: (...params: unknown[]) => unknown;
};

type SqliteDatabase = {
  exec: (sql: string) => void;
  prepare: (sql: string) => SqliteStatement;
};

type SqliteDatabaseCtor = new (filename: string) => SqliteDatabase;

const DEFAULT_SQLITE_DB_PATH = path.join(process.cwd(), "data", "products.db");
const PRODUCTS_DATABASE_URL = resolveProductsDatabaseUrl();
const PRODUCTS_DB_PROVIDER = resolveProductsDbProvider();
const SQLITE_DB_PATH = resolveSqliteDbPath();

const scryptAsync = promisify(crypto.scrypt);
const PASSWORD_HASH_ALGORITHM = "scrypt";
const PASSWORD_HASH_KEYLEN = 64;

let sqliteCtor: SqliteDatabaseCtor | null = null;
let sqliteDatabase: SqliteDatabase | null = null;
let sqliteInitializationPromise: Promise<void> | null = null;
let postgresInitializationPromise: Promise<void> | null = null;

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

function resolvePostgresPool() {
  if (!PRODUCTS_DATABASE_URL) {
    throw new Error(
      "Missing PRODUCTS_DATABASE_URL or DATABASE_URL for member account storage."
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

  type GlobalWithPool = typeof globalThis & { __club47MembersPool?: Pool };
  const globalForPool = globalThis as GlobalWithPool;

  if (!globalForPool.__club47MembersPool) {
    globalForPool.__club47MembersPool = new Pool(poolConfig);
  }

  return globalForPool.__club47MembersPool;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function parsePasswordHash(passwordHash: string) {
  const [algorithm, saltPart, hashPart] = passwordHash.split("$");
  if (algorithm !== PASSWORD_HASH_ALGORITHM || !saltPart || !hashPart) {
    return null;
  }

  try {
    return {
      salt: Buffer.from(saltPart, "base64url"),
      hash: Buffer.from(hashPart, "base64url")
    };
  } catch {
    return null;
  }
}

async function createPasswordHash(password: string) {
  const salt = crypto.randomBytes(16);
  const derived = (await scryptAsync(password, salt, PASSWORD_HASH_KEYLEN)) as Buffer;
  return `${PASSWORD_HASH_ALGORITHM}$${salt.toString("base64url")}$${derived.toString("base64url")}`;
}

async function verifyPasswordHash(password: string, passwordHash: string) {
  const parsed = parsePasswordHash(passwordHash);
  if (!parsed) {
    return false;
  }

  const derived = (await scryptAsync(password, parsed.salt, parsed.hash.length)) as Buffer;
  if (derived.length !== parsed.hash.length) {
    return false;
  }

  return crypto.timingSafeEqual(derived, parsed.hash);
}

async function initializeSqliteIfNeeded() {
  if (sqliteInitializationPromise) {
    return sqliteInitializationPromise;
  }

  sqliteInitializationPromise = (async () => {
    await fs.mkdir(path.dirname(SQLITE_DB_PATH), { recursive: true });

    const db = getSqliteDatabase();
    db.exec(`
      CREATE TABLE IF NOT EXISTS member_accounts (
        email TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    db.exec(
      "CREATE INDEX IF NOT EXISTS idx_member_accounts_status ON member_accounts(status);"
    );
  })();

  try {
    await sqliteInitializationPromise;
  } catch (error) {
    sqliteInitializationPromise = null;
    throw error;
  }
}

async function initializePostgresIfNeeded() {
  if (postgresInitializationPromise) {
    return postgresInitializationPromise;
  }

  postgresInitializationPromise = (async () => {
    const pool = resolvePostgresPool();
    await pool.query(`
      CREATE TABLE IF NOT EXISTS member_accounts (
        email TEXT PRIMARY KEY,
        password_hash TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'active',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await pool.query(
      "CREATE INDEX IF NOT EXISTS idx_member_accounts_status ON member_accounts(status);"
    );
  })();

  try {
    await postgresInitializationPromise;
  } catch (error) {
    postgresInitializationPromise = null;
    throw error;
  }
}

async function upsertMemberAccountInSqlite(email: string, passwordHash: string) {
  await initializeSqliteIfNeeded();

  const normalizedEmail = normalizeEmail(email);
  const now = new Date().toISOString();
  getSqliteDatabase()
    .prepare(
      `
      INSERT INTO member_accounts (
        email,
        password_hash,
        status,
        created_at,
        updated_at
      )
      VALUES (?, ?, 'active', ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        password_hash = excluded.password_hash,
        status = 'active',
        updated_at = excluded.updated_at;
      `
    )
    .run(normalizedEmail, passwordHash, now, now);
}

async function upsertMemberAccountInPostgres(email: string, passwordHash: string) {
  await initializePostgresIfNeeded();

  const normalizedEmail = normalizeEmail(email);
  await resolvePostgresPool().query(
    `
    INSERT INTO member_accounts (
      email,
      password_hash,
      status,
      created_at,
      updated_at
    )
    VALUES ($1, $2, 'active', NOW(), NOW())
    ON CONFLICT(email) DO UPDATE SET
      password_hash = EXCLUDED.password_hash,
      status = 'active',
      updated_at = NOW();
    `,
    [normalizedEmail, passwordHash]
  );
}

async function findMemberPasswordHashInSqlite(email: string) {
  await initializeSqliteIfNeeded();

  const row = getSqliteDatabase()
    .prepare(
      `
      SELECT password_hash
      FROM member_accounts
      WHERE email = ? AND status = 'active'
      LIMIT 1;
      `
    )
    .get(normalizeEmail(email)) as { password_hash?: string } | undefined;

  return row?.password_hash ?? null;
}

async function findMemberPasswordHashInPostgres(email: string) {
  await initializePostgresIfNeeded();

  const result = await resolvePostgresPool().query<{ password_hash: string }>(
    `
    SELECT password_hash
    FROM member_accounts
    WHERE email = $1 AND status = 'active'
    LIMIT 1;
    `,
    [normalizeEmail(email)]
  );

  return result.rows[0]?.password_hash ?? null;
}

function isEnvironmentMemberMatch(email: string, password: string) {
  const configuredEmail = process.env.CLUB_MEMBER_EMAIL?.trim().toLowerCase();
  const configuredPassword = process.env.CLUB_MEMBER_PASSWORD;

  if (!configuredEmail || !configuredPassword) {
    return false;
  }

  return normalizeEmail(email) === configuredEmail && password === configuredPassword;
}

export async function hashMemberPasswordForStorage(password: string) {
  return createPasswordHash(password);
}

export async function upsertMemberAccountWithPasswordHash(
  email: string,
  passwordHash: string
) {
  if (!parsePasswordHash(passwordHash)) {
    throw new Error("Invalid password hash format");
  }

  if (PRODUCTS_DB_PROVIDER === "postgres") {
    await upsertMemberAccountInPostgres(email, passwordHash);
    return;
  }

  await upsertMemberAccountInSqlite(email, passwordHash);
}

export async function isValidMemberCredentialsAgainstStore(
  email: string,
  password: string
) {
  if (isEnvironmentMemberMatch(email, password)) {
    return true;
  }

  const storedHash =
    PRODUCTS_DB_PROVIDER === "postgres"
      ? await findMemberPasswordHashInPostgres(email)
      : await findMemberPasswordHashInSqlite(email);

  if (!storedHash) {
    return false;
  }

  return verifyPasswordHash(password, storedHash);
}
