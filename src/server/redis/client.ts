import { Redis } from "ioredis";
import { env } from "~/env";

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined;
};

function createRedisClient() {
  if (!env.server.REDIS_URL) {
    return null;
  }

  const client = new Redis(env.server.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  // Prevent crash on unhandled error events (e.g. connection refused)
  client.on("error", (err) => {
    // Only log if it's not a common connection retry error to avoid spamming
    if (process.env.NODE_ENV === "development") {
      console.warn("[Redis] Client error:", err.message);
    }
  });

  return client;
}

export const redis = globalForRedis.redis ?? createRedisClient();

if (env.server.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
