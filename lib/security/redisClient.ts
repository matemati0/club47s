import "server-only";

import { Redis } from "@upstash/redis";

type RedisClient = Redis;

let redisClient: RedisClient | null | undefined;
let didWarnMissingConfig = false;

function readFirstEnv(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) {
      return value;
    }
  }
  return "";
}

function resolveRedisConfig() {
  const url = readFirstEnv("SECURITY_REDIS_REST_URL", "UPSTASH_REDIS_REST_URL");
  const token = readFirstEnv("SECURITY_REDIS_REST_TOKEN", "UPSTASH_REDIS_REST_TOKEN");

  if (!url || !token) {
    return null;
  }

  return { url, token };
}

export function getSecurityRedisClient() {
  if (redisClient !== undefined) {
    return redisClient;
  }

  const config = resolveRedisConfig();
  if (!config) {
    redisClient = null;

    if (process.env.NODE_ENV === "production" && !didWarnMissingConfig) {
      console.warn(
        "[security] Redis is not configured. Falling back to in-memory security stores."
      );
      didWarnMissingConfig = true;
    }

    return redisClient;
  }

  redisClient = new Redis(config);
  return redisClient;
}

