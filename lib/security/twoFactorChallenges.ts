import "server-only";

import crypto from "node:crypto";
import type { TwoFactorTargetMode } from "@/lib/auth";

type TwoFactorChallengeRecord = {
  id: string;
  email: string;
  targetMode: TwoFactorTargetMode;
  codeHash: Buffer;
  registrationPasswordHash?: string;
  expiresAt: number;
};

const challenges = new Map<string, TwoFactorChallengeRecord>();

function cleanupExpiredChallenges(now = Date.now()) {
  for (const [id, challenge] of challenges.entries()) {
    if (challenge.expiresAt <= now) {
      challenges.delete(id);
    }
  }
}

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code, "utf8").digest();
}

function createChallengeId() {
  return crypto.randomBytes(32).toString("base64url");
}

export function createTwoFactorChallenge(input: {
  email: string;
  targetMode: TwoFactorTargetMode;
  code: string;
  registrationPasswordHash?: string;
  expiresAt: number;
}) {
  cleanupExpiredChallenges();

  const id = createChallengeId();
  challenges.set(id, {
    id,
    email: input.email.trim().toLowerCase(),
    targetMode: input.targetMode,
    codeHash: hashCode(input.code),
    registrationPasswordHash: input.registrationPasswordHash,
    expiresAt: input.expiresAt
  });

  return { id, expiresAt: input.expiresAt };
}

export function getTwoFactorChallengeMeta(id: string) {
  cleanupExpiredChallenges();
  const challenge = challenges.get(id);
  if (!challenge) {
    return null;
  }

  if (challenge.expiresAt <= Date.now()) {
    challenges.delete(id);
    return null;
  }

  return {
    email: challenge.email,
    targetMode: challenge.targetMode,
    expiresAt: challenge.expiresAt
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

export function verifyAndConsumeTwoFactorChallenge(
  id: string,
  code: string
): VerifyTwoFactorChallengeResult {
  cleanupExpiredChallenges();

  const challenge = challenges.get(id);
  if (!challenge) {
    return { ok: false, reason: "missing" };
  }

  if (challenge.expiresAt <= Date.now()) {
    challenges.delete(id);
    return { ok: false, reason: "expired" };
  }

  const submittedHash = hashCode(code);
  const match =
    submittedHash.length === challenge.codeHash.length &&
    crypto.timingSafeEqual(submittedHash, challenge.codeHash);

  if (!match) {
    return { ok: false, reason: "invalid_code" };
  }

  challenges.delete(id);
  return {
    ok: true,
    email: challenge.email,
    targetMode: challenge.targetMode,
    registrationPasswordHash: challenge.registrationPasswordHash
  };
}

export function clearTwoFactorChallenge(id: string) {
  challenges.delete(id);
}
