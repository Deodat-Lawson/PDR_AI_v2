import { eq, and } from "drizzle-orm";
import { db } from "~/server/db";
import { companyServiceKeys } from "~/server/db/schema";
import { redis } from "~/server/redis/client";
import { decryptValue } from "~/lib/encryption";
import { env } from "~/env";

const KEY_CACHE_TTL = 60 * 60 * 24; // 24 hours

/**
 * Service to manage and retrieve company-specific API keys with Redis caching.
 */
export class CompanyKeyService {
  /**
   * Get a company-specific API key.
   * Checks Redis cache first, then database.
   */
  static async getKey(
    companyId: number | bigint | string,
    keyType: string
  ): Promise<string | null> {
    const cid = BigInt(companyId);
    const cacheKey = `company:${cid}:keys:${keyType}`;

    // 1. Try Redis
    try {
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) return cached;
      }
    } catch (err) {
      console.warn(`[CompanyKeyService] Redis error for ${cacheKey}:`, err);
    }

    // 2. Try Database
    try {
      const [record] = await db
        .select({
          keyValue: companyServiceKeys.keyValue,
        })
        .from(companyServiceKeys)
        .where(
          and(
            eq(companyServiceKeys.companyId, cid),
            eq(companyServiceKeys.keyType, keyType)
          )
        )
        .limit(1);

      if (!record) return null;

      // 3. Decrypt and Cache
      const decrypted = decryptValue(record.keyValue);
      
      try {
        if (redis) {
          await redis.set(cacheKey, decrypted, "EX", KEY_CACHE_TTL);
        }
      } catch (err) {
        console.warn(`[CompanyKeyService] Redis set error for ${cacheKey}:`, err);
      }

      return decrypted;
    } catch (err) {
      console.error(`[CompanyKeyService] DB error fetching key ${keyType} for company ${cid}:`, err);
      return null;
    }
  }

  /**
   * Get an effective API key, prioritizing company-specific key over environment variable.
   * @param companyId - The company ID
   * @param keyType - The key type in the database (e.g. "OPENAI_API_KEY")
   * @param envVarName - The fallback environment variable name (e.g. "OPENAI_API_KEY")
   */
  static async getEffectiveKey(
    companyId: number | bigint | string | undefined | null,
    keyType: string,
    envVarName?: keyof typeof env.server
  ): Promise<string | undefined> {
    // 1. Try Company Key if companyId is provided
    if (companyId) {
      const companyKey = await this.getKey(companyId, keyType);
      if (companyKey) return companyKey;
    }

    // 2. Fallback to Environment Variable
    if (envVarName) {
      // @ts-expect-error - env.server is typesafe but dynamic access is hard to type perfectly here without more boilerplate
      return env.server[envVarName]; 
    }

    return undefined;
  }

  /**
   * Invalidate the cache for a specific key.
   * Should be called when keys are updated/deleted.
   */
  static async invalidateKey(
    companyId: number | bigint | string,
    keyType: string
  ): Promise<void> {
    const cid = BigInt(companyId);
    const cacheKey = `company:${cid}:keys:${keyType}`;
    try {
      if (redis) {
        await redis.del(cacheKey);
      }
    } catch (err) {
      console.warn(`[CompanyKeyService] Redis delete error for ${cacheKey}:`, err);
    }
  }
}

