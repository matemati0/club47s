import { NextRequest } from "next/server";

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

function getOrCreateEntry(key: string, now: number) {
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

export function getLoginRateLimitKey(request: NextRequest) {
  const ip = parseClientIp(request);
  return `login:${ip}`;
}

export function getLoginBlockState(key: string, now = Date.now()) {
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

export function registerFailedLoginAttempt(key: string, now = Date.now()) {
  cleanupStaleEntries(now);
  const entry = getOrCreateEntry(key, now);

  entry.failedAttempts += 1;

  if (entry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    entry.blockedUntil = now + BLOCK_DURATION_MS;
  }

  const delayMs = Math.min(
    MAX_DELAY_MS,
    BASE_DELAY_MS + entry.failedAttempts * STEP_DELAY_MS
  );

  return {
    delayMs,
    blocked: entry.blockedUntil !== null && entry.blockedUntil > now
  };
}

export function clearFailedLoginAttempts(key: string) {
  attemptsStore.delete(key);
}
