"use client";

import { useState, useEffect, useRef } from "react";
import { Match } from "@/lib/types";

const STARRED_MATCHES_KEY = "zoroscore_starred_matches";

interface StarredMatchData {
  matchId: string;
  cachedData: Match; // Backup data from when it was starred
  starredAt: number;
}

export function useStarredMatches() {
  const [starredData, setStarredData] = useState<Map<string, StarredMatchData>>(
    new Map()
  );
  
  // Track if we've loaded from localStorage yet
  const hasLoadedRef = useRef(false);

  // Load starred matches from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasLoadedRef.current) return; // Already loaded

    try {
      const stored = localStorage.getItem(STARRED_MATCHES_KEY);
      console.log("🔍 [useStarredMatches] Initial load:", stored ? "Found data" : "Empty");

      if (stored) {
        const parsed: StarredMatchData[] = JSON.parse(stored);
        const matchMap = new Map<string, StarredMatchData>();
        
        parsed.forEach(item => {
          matchMap.set(item.matchId, item);
        });

        console.log("✅ [useStarredMatches] Loaded", matchMap.size, "starred matches");
        setStarredData(matchMap);
      }
      
      hasLoadedRef.current = true; // Mark as loaded
    } catch (error) {
      console.error("❌ [useStarredMatches] Error loading:", error);
      hasLoadedRef.current = true; // Still mark as loaded to prevent retry
    }
  }, []);

  // Save to localStorage whenever starred data changes (BUT NOT on initial mount!)
  useEffect(() => {
    // Don't save until we've loaded from localStorage
    if (!hasLoadedRef.current) {
      console.log("⏭️ [useStarredMatches] Skipping save - not loaded yet");
      return;
    }

    const dataToSave = Array.from(starredData.values());
    console.log("💾 [useStarredMatches] Saving", dataToSave.length, "starred matches");
    localStorage.setItem(STARRED_MATCHES_KEY, JSON.stringify(dataToSave));
  }, [starredData]);

  /**
   * Toggle star - STORES ID + FULL MATCH DATA
   * @param matchId - The match ID
   * @param matchData - The FULL match object (required for starring)
   */
  const toggleStar = (matchId: string, matchData?: Match) => {
    console.log("⭐ [useStarredMatches] Toggle star for:", matchId);
    
    setStarredData(prev => {
      const newMap = new Map(prev);
      
      if (newMap.has(matchId)) {
        // Unstar
        console.log("➖ [useStarredMatches] Removing star");
        newMap.delete(matchId);
      } else {
        // Star - MUST have data to star!
        if (!matchData) {
          console.error("❌ [useStarredMatches] Cannot star: matchData is required!");
          return prev;
        }
        
        console.log("➕ [useStarredMatches] Adding star:", matchData.homeTeam.name, "vs", matchData.awayTeam.name);
        newMap.set(matchId, {
          matchId,
          cachedData: matchData, // Store as backup!
          starredAt: Date.now()
        });
      }
      
      console.log("📊 [useStarredMatches] New count:", newMap.size);
      return newMap;
    });
  };

  const isStarred = (matchId: string): boolean => {
    return starredData.has(matchId);
  };

  const clearAllStarred = () => {
    console.log("🗑️ [useStarredMatches] Clearing all");
    setStarredData(new Map());
  };

  const getStarredCount = (): number => {
    return starredData.size;
  };

  /**
   * Get starred match IDs as an array
   */
  const getStarredMatchIds = (): string[] => {
    return Array.from(starredData.keys());
  };

  /**
   * Get cached data for a match (fallback if fresh data not available)
   */
  const getCachedMatchData = (matchId: string): Match | undefined => {
    return starredData.get(matchId)?.cachedData;
  };

  /**
   * Get all starred data (for debugging/export)
   */
  const getAllStarredData = (): StarredMatchData[] => {
    return Array.from(starredData.values());
  };

  return {
    toggleStar,
    isStarred,
    clearAllStarred,
    getStarredCount,
    getStarredMatchIds,
    getCachedMatchData,
    getAllStarredData,
  };
}