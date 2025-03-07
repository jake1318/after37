import NodeCache from "node-cache";
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();

// Cache TTL values in seconds
const TTL = {
  SHORT: parseInt(process.env.CACHE_TTL_SHORT || "60"), // Default 60 seconds
  MEDIUM: parseInt(process.env.CACHE_TTL_MEDIUM || "300"), // Default 5 minutes
  LONG: parseInt(process.env.CACHE_TTL_LONG || "3600"), // Default 1 hour
};

class CacheManager {
  constructor() {
    this.cache = new NodeCache({
      stdTTL: TTL.MEDIUM, // Default TTL
      checkperiod: TTL.SHORT, // Check for expired keys interval
      useClones: false,
    });

    logger.info(`Cache initialized with default TTL: ${TTL.MEDIUM} seconds`);
  }

  async getOrSet(key, fetchFn, ttl = TTL.MEDIUM) {
    const cachedData = this.cache.get(key);

    if (cachedData !== undefined) {
      logger.debug(`Cache hit for key: ${key}`);
      return cachedData;
    }

    logger.debug(`Cache miss for key: ${key}, fetching data...`);
    try {
      const data = await fetchFn();
      this.cache.set(key, data, ttl);
      return data;
    } catch (error) {
      logger.error(`Error fetching data for key ${key}:`, error);
      throw error;
    }
  }

  invalidate(key) {
    logger.debug(`Invalidating cache for key: ${key}`);
    return this.cache.del(key);
  }

  invalidatePattern(pattern) {
    const keys = this.cache.keys();
    const matchingKeys = keys.filter((key) => key.includes(pattern));

    logger.debug(
      `Invalidating ${matchingKeys.length} keys matching pattern: ${pattern}`
    );
    matchingKeys.forEach((key) => this.cache.del(key));

    return matchingKeys.length;
  }

  flushAll() {
    logger.debug("Flushing entire cache");
    return this.cache.flushAll();
  }

  getStats() {
    return this.cache.getStats();
  }

  static get TTL() {
    return TTL;
  }
}

export default new CacheManager();
