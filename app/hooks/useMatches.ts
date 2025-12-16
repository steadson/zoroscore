"use client";

import { useState, useEffect } from "react";
import { Match } from "@/lib/types";

const MATCHES_CACHE_KEY = "zoroscore_matches_cache";
const CACHE_TIMESTAMP_KEY = "zoroscore_matches_cache_timestamp";
const CACHE_EXPIRY_MS = 2 * 60 * 1000; // 2 minutes only (for live data)

export function useMatches(refreshInterval: number = 30000) {
  // Initialize with cached data if available
  const [matches, setMatches] = useState<Match[]>(() => {
    if (typeof window === "undefined") return [];

    try {
      const cached = localStorage.getItem(MATCHES_CACHE_KEY);
      const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

      if (cached && timestamp) {
        const cacheAge = Date.now() - parseInt(timestamp);

        // For live sports, only use cache if less than 2 minutes old
        if (cacheAge < CACHE_EXPIRY_MS) {
          const cachedMatches = JSON.parse(cached);
          console.log(
            "📦 [useMatches] Loading",
            cachedMatches.length,
            "matches from cache"
          );
          console.log(
            "⏱️ [useMatches] Cache age:",
            Math.floor(cacheAge / 1000),
            "seconds"
          );
          return cachedMatches;
        } else {
          console.log(
            "⏰ [useMatches] Cache too old (",
            Math.floor(cacheAge / 1000),
            "s), fetching fresh"
          );
          // Clear old cache
          localStorage.removeItem(MATCHES_CACHE_KEY);
          localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        }
      }
    } catch (error) {
      console.error("❌ [useMatches] Error loading cache:", error);
    }

    return [];
  });

  const [loading, setLoading] = useState(() => matches.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(
    () => {
      const fetchMatches = async (isBackgroundRefresh = false) => {
        try {
          if (!isBackgroundRefresh) {
            setLoading(true);
            console.log("🔄 [useMatches] Fetching matches (initial load)...");
          } else {
            setIsRefreshing(true);
            console.log("🔄 [useMatches] Refreshing matches (background)...");
          }

          const response = await fetch("/api/matches/all?today=true");
          const data = await response.json();

          if (data.success) {
            setMatches(data.matches);
            setError(null);

            // Save to cache with fresh timestamp
            try {
              localStorage.setItem(
                MATCHES_CACHE_KEY,
                JSON.stringify(data.matches)
              );
              localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
              console.log(
                "💾 [useMatches] Cached",
                data.matches.length,
                "matches at",
                new Date().toLocaleTimeString()
              );
            } catch (cacheError) {
              console.error("⚠️ [useMatches] Failed to cache:", cacheError);
            }
          } else {
            setError(data.error || "Failed to fetch matches");
          }
        } catch (err) {
          setError("Failed to fetch matches");
          console.error("❌ [useMatches] Error fetching matches:", err);
        } finally {
          setLoading(false);
          setIsRefreshing(false);
        }
      };

      // Initial fetch
      const isBackgroundRefresh = matches.length > 0; // If we have cached data, this is a background refresh
      fetchMatches(isBackgroundRefresh);

      // Set up interval for auto-refresh (always background after first load)
      const interval = setInterval(() => {
        console.log("⏰ [useMatches] Auto-refresh triggered");
        fetchMatches(true);
      }, refreshInterval);

      // Cleanup
      return () => {
        console.log("🧹 [useMatches] Cleaning up interval");
        clearInterval(interval);
      };
    },
    [refreshInterval]
  );

  // Clear cache when component unmounts (page closes)
  useEffect(() => {
    return () => {
      console.log(
        "👋 [useMatches] Component unmounting, keeping cache for quick return"
      );
      // Note: We keep the cache so user can come back quickly
      // It will auto-expire after 2 minutes anyway
    };
  }, []);

  return {
    matches,
    loading,
    error,
    isRefreshing // Indicates background refresh in progress
  };
}
