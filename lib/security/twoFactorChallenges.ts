import "server-only";

import crypto from "node:crypto";
import type { TwoFactorTargetMode } from "@/lib/auth";
import { getSecurityRedisClient } from "@/lib/security/redisClient";

type TwoFactorChallengeRecord = {
  id: string;
  email: string;
  targetMode: TwoFactorTargetMode;
  codeHash: string;
  registrationPasswordHash?: string;
  expiresAt: number;
};

const challenges = new Map<string, TwoFactorChallengeRecord>();
const REDIS_KEY_PREFIX = "security:two-factor-challenge";

function toRedisKey(id: string) {
  return `${REDIS_KEY_PREFIX}:${id}`;
}

function cleanupExpiredChallenges(now = Date.now()) {
  for (const [id, challenge] of challenges.entries()) {
    if (challenge.expiresAt <= now) {
      challenges.delete(id);
    }
  }
}

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code, "utf8").digest("base64url");
}

function createChallengeId() {
  return crypto.randomBytes(32).toString("base64url");
}

function isHashMatch(leftBase64Url: string, rightBase64Url: string) {
  const left = Buffer.from(leftBase64Url, "base64url");
  const right = Buffer.from(rightBase64Url, "base64url");
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

async function readChallengeFromRedis(id: string): Promise<TwoFactorChallengeRecord | null> {
  const redis = getSecurityRedisClient();
  if (!redis) {
    return null;
  }

  const raw = await redis.get<string>(toRedisKey(id));
  if (typeof raw !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TwoFactorChallengeRecord> | null;
    if (!parsed || typeof parsed.id !== "string") {
      return null;
    }

    if (parsed.targetMode !== "member" && parsed.targetMode !== "admin") {
      return null;
    }

    if (
      typeof parsed.email !== "string" ||
      typeof parsed.codeHash !== "string" ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }

    return {
      id: parsed.id,
      email: parsed.email,
      targetMode: parsed.targetMode,
      codeHash: parsed.codeHash,
      registrationPasswordHash:
        typeof parsed.registrationPasswordHash === "string"
          ? parsed.registrationPasswordHash
          : undefined,
      expiresAt: parsed.expiresAt
    };
  } catch {
    return null;
  }
}

async function writeChallengeToRedis(challenge: TwoFactorChallengeRecord) {
  const redis = getSecurityRedisClient();
  if (!redis) {
    return;
  }

  const now = Date.now();
  const ttlSeconds = Math.max(1, Math.ceil((challenge.expiresAt - now) / 1000));
  await redis.set(toRedisKey(challenge.id), JSON.stringify(challenge), {
    ex: ttlSeconds
  });
}

async function deleteChallengeFromRedis(id: string) {
  const redis = getSecurityRedisClient();
  if (!redis) {
    return;
  }

  await redis.del(toRedisKey(id));
}

export async function createTwoFactorChallenge(input: {
  email: string;
  targetMode: TwoFactorTargetMode;
  code: string;
  registrationPasswordHash?: string;
  expiresAt: number;
}) {
  cleanupExpiredChallenges();

  const id = createChallengeId();
  const challenge: TwoFactorChallengeRecord = {
    id,
    email: input.email.trim().toLowerCase(),
    targetMode: input.targetMode,
    codeHash: hashCode(input.code),
    registrationPasswordHash: input.registrationPasswordHash,
    expiresAt: input.expiresAt
  };

  challenges.set(id, challenge);
  await writeChallengeToRedis(challenge);

  return { id, expiresAt: input.expiresAt };
}

export async function getTwoFactorChallengeMeta(id: string) {
  cleanupExpiredChallenges();

  const now = Date.now();
  const inMemory = challenges.get(id);
  if (inMemory && inMemory.expiresAt > now) {
    return {
      email: inMemory.email,
      targetMode: inMemory.targetMode,
      expiresAt: inMemory.expiresAt
    };
  }

  if (inMemory && inMemory.expiresAt <= now) {
    challenges.delete(id);
  }

  const fromRedis = await readChallengeFromRedis(id);
  if (!fromRedis) {
    return null;
  }

  if (fromRedis.expiresAt <= now) {
    await deleteChallengeFromRedis(id);
    return null;
  }

  challenges.set(id, fromRedis);

  return {
    email: fromRedis.email,
    targetMode: fromRedis.targetMode,
    expiresAt: fromRedis.expiresAt
  };
}

export type VerifyTwoFactorChallengeResult =
  | {
      ok: true;
      email: string;
      targetMode: TwoFactorTargetMode;
      registrationPasswordHash?: string;
    }
  | { ok: false; reason: "missing" | "expired" | "invalid_code" };

export async function verifyAndConsumeTwoFactorChallenge(
  id: string,
  code: string
): Promise<VerifyTwoFactorChallengeResult> {
  cleanupExpiredChallenges();

  const now = Date.now();
  const inMemory = challenges.get(id);
  const challenge =
    inMemory && inMemory.expiresAt > now ? inMemory : await readChallengeFromRedis(id);

  if (!challenge) {
    return { ok: false, reason: "missing" };
  }

  if (challenge.expiresAt <= now) {
    challenges.delete(id);
    await deleteChallengeFromRedis(id);
    return { ok: false, reason: "expired" };
  }

  const submittedHash = hashCode(code);
  if (!isHashMatch(submittedHash, challenge.codeHash)) {
    return { ok: false, reason: "invalid_code" };
  }

  challenges.delete(id);
  await deleteChallengeFromRedis(id);

  return {
    ok: true,
    email: challenge.email,
    targetMode: challenge.targetMode,
    registrationPasswordHash: challenge.registrationPasswordHash
  };
}

export async function clearTwoFactorChallenge(id: string) {
  challenges.delete(id);
  await deleteChallengeFromRedis(id);
}

