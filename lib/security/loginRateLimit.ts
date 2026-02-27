import "server-only";

import { NextRequest } from "next/server";
import { getSecurityRedisClient } from "@/lib/security/redisClient";

const MAX_FAILED_ATTEMPTS = 5;
const FAILURE_WINDOW_MS = 10 * 60 * 1000;
const BLOCK_DURATION_MS = 15 * 60 * 1000;
const BASE_DELAY_MS = 250;
const STEP_DELAY_MS = 250;
const MAX_DELAY_MS = 2000;

type FailureEntry = {
  failedAttempts: number;
  firstFailureAt: number;
  blockedUntil: number | null;
};

const attemptsStore = new Map<string, FailureEntry>();
const REDIS_KEY_PREFIX = "security:login-attempts";

function parseClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown-ip";
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown-ip";
}

function toRedisKey(key: string) {
  return `${REDIS_KEY_PREFIX}:${key}`;
}

function computeEntryTtlSeconds(entry: FailureEntry, now: number) {
  const blockedTtlMs =
    entry.blockedUntil !== null && entry.blockedUntil > now
      ? entry.blockedUntil - now
      : 0;
  const windowTtlMs = Math.max(0, FAILURE_WINDOW_MS - (now - entry.firstFailureAt));
  const ttlMs = Math.max(blockedTtlMs, windowTtlMs, 1000);
  return Math.max(1, Math.ceil(ttlMs / 1000));
}

function cleanupStaleEntries(now: number) {
  for (const [key, value] of attemptsStore.entries()) {
    const entryExpired =
      value.blockedUntil !== null
        ? value.blockedUntil <= now
        : now - value.firstFailureAt > FAILURE_WINDOW_MS;

    if (entryExpired) {
      attemptsStore.delete(key);
    }
  }
}

function getOrCreateMemoryEntry(key: string, now: number) {
  const current = attemptsStore.get(key);

  if (!current) {
    const freshEntry: FailureEntry = {
      failedAttempts: 0,
      firstFailureAt: now,
      blockedUntil: null
    };
    attemptsStore.set(key, freshEntry);
    return freshEntry;
  }

  if (current.blockedUntil === null && now - current.firstFailureAt > FAILURE_WINDOW_MS) {
    current.failedAttempts = 0;
    current.firstFailureAt = now;
  }

  return current;
}

async function readEntryFromRedis(key: string): Promise<FailureEntry | null> {
  const redis = getSecurityRedisClient();
  if (!redis) {
    return null;
  }

  const raw = await redis.get<string>(toRedisKey(key));
  if (typeof raw !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<FailureEntry> | null;
    if (!parsed) {
      return null;
    }

    const failedAttempts = Number(parsed.failedAttempts ?? 0);
    const firstFailureAt = Number(parsed.firstFailureAt ?? 0);
    const blockedUntil =
      parsed.blockedUntil === null || parsed.blockedUntil === undefined
        ? null
        : Number(parsed.blockedUntil);

    if (!Number.isFinite(failedAttempts) || !Number.isFinite(firstFailureAt)) {
      return null;
    }

    return {
      failedAttempts: Math.max(0, Math.trunc(failedAttempts)),
      firstFailureAt,
      blockedUntil: blockedUntil !== null && Number.isFinite(blockedUntil) ? blockedUntil : null
    };
  } catch {
    return null;
  }
}

async function writeEntryToRedis(key: string, entry: FailureEntry, now: number) {
  const redis = getSecurityRedisClient();
  if (!redis) {
    return;
  }

  const ttlSeconds = computeEntryTtlSeconds(entry, now);
  await redis.set(toRedisKey(key), JSON.stringify(entry), {
    ex: ttlSeconds
  });
}

async function deleteEntryFromRedis(key: string) {
  const redis = getSecurityRedisClient();
  if (!redis) {
    return;
  }

  await redis.del(toRedisKey(key));
}

async function getOrCreateEntry(key: string, now: number) {
  const redis = getSecurityRedisClient();
  if (!redis) {
    cleanupStaleEntries(now);
    return getOrCreateMemoryEntry(key, now);
  }

  const existing = await readEntryFromRedis(key);
  if (!existing) {
    return {
      failedAttempts: 0,
      firstFailureAt: now,
      blockedUntil: null
    } satisfies FailureEntry;
  }

  if (existing.blockedUntil === null && now - existing.firstFailureAt > FAILURE_WINDOW_MS) {
    return {
      failedAttempts: 0,
      firstFailureAt: now,
      blockedUntil: null
    } satisfies FailureEntry;
  }

  return existing;
}

export function getLoginRateLimitKey(request: NextRequest) {
  const ip = parseClientIp(request);
  return `login:${ip}`;
}

export async function getLoginBlockState(key: string, now = Date.now()) {
  const redis = getSecurityRedisClient();
  if (!redis) {
    cleanupStaleEntries(now);
    const entry = attemptsStore.get(key);
    if (!entry || entry.blockedUntil === null || entry.blockedUntil <= now) {
      return { blocked: false, retryAfterSeconds: 0 };
    }

    return {
      blocked: true,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.blockedUntil - now) / 1000))
    };
  }

  const entry = await readEntryFromRedis(key);
  if (!entry || entry.blockedUntil === null || entry.blockedUntil <= now) {
    if (entry && entry.blockedUntil !== null && entry.blockedUntil <= now) {
      await deleteEntryFromRedis(key);
    }
    return { blocked: false, retryAfterSeconds: 0 };
  }

  return {
    blocked: true,
    retryAfterSeconds: Math.max(1, Math.ceil((entry.blockedUntil - now) / 1000))
  };
}

export async function registerFailedLoginAttempt(key: string, now = Date.now()) {
  const entry = await getOrCreateEntry(key, now);
  entry.failedAttempts += 1;

  if (entry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_DURATION_MS;
  }

  const delayMs = Math.min(
    MAX_DELAY_MS,
    BASE_DELAY_MS + entry.failedAttempts * STEP_DELAY_MS
  );

  const redis = getSecurityRedisClient();
  if (!redis) {
    attemptsStore.set(key, entry);
  } else {
    await writeEntryToRedis(key, entry, now);
  }

  return {
    delayMs,
    blocked: entry.blockedUntil !== null && entry.blockedUntil > now
  };
}

export async function clearFailedLoginAttempts(key: string) {
  attemptsStore.delete(key);
  await deleteEntryFromRedis(key);
}

