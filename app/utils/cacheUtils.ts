/**
 * Cache management utilities for ZoroScore
 */

const MATCHES_CACHE_KEY = "zoroscore_matches_cache";
const CACHE_TIMESTAMP_KEY = "zoroscore_matches_cache_timestamp";

export const cacheUtils = {
  /**
   * Clear the matches cache
   */
  clearMatchesCache: () => {
    try {
      localStorage.removeItem(MATCHES_CACHE_KEY);
      localStorage.removeItem(CACHE_TIMESTAMP_KEY);
      console.log("🗑️ Matches cache cleared");
    } catch (error) {
      console.error("❌ Error clearing cache:", error);
    }
  },

  /**
   * Get cache age in seconds
   */
  getCacheAge: (): number | null => {
    try {
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
      if (timestamp) {
        return Math.floor((Date.now() - parseInt(timestamp)) / 1000);
      }
    } catch (error) {
      console.error("❌ Error getting cache age:", error);
    }
    return null;
  },

  /**
   * Check if cache exists
   */
  hasCache: (): boolean => {
    try {
      return !!localStorage.getItem(MATCHES_CACHE_KEY);
    } catch (error) {
      return false;
    }
  },

  /**
   * Get cached match count
   */
  getCachedMatchCount: (): number => {
    try {
      const cached = localStorage.getItem(MATCHES_CACHE_KEY);
      if (cached) {
        const matches = JSON.parse(cached);
        return matches.length;
      }
    } catch (error) {
      console.error("❌ Error getting cached match count:", error);
    }
    return 0;
  }
};
