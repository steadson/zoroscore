"use client";

import { useMemo, useEffect, useState } from "react";
import { useMatches } from "../hooks/useMatches";
import { useStarredMatches } from "../hooks/useStarredMatches";
import Header from "../components/Header";
import LeagueSection from "../components/LeagueSection";
import LoadingSpinner from "../components/LoadingSpinner";
import { Match } from "@/lib/types";

export default function StarredPage() {
  const { matches, loading, error } = useMatches(30000); // Fresh data from API

  const {
    isStarred,
    toggleStar,
    clearAllStarred,
    getStarredCount,
    getStarredMatchIds, // IDs to look for
    getCachedMatchData // Fallback data
  } = useStarredMatches();

  const starredMatchIds = getStarredMatchIds();

  // HYBRID MATCHING: Try fresh data first, fall back to cached
  const starredMatches = useMemo(
    () => {
      const result: Match[] = [];
      const freshMatchMap = new Map(matches.map(m => [m.match_id, m]));

      starredMatchIds.forEach(matchId => {
        // 1. Try to get FRESH data from current matches
        const freshMatch = freshMatchMap.get(matchId);

        if (freshMatch) {
          // ✅ Found fresh data - use it!
          console.log(
            `✅ Fresh data for ${matchId}:`,
            freshMatch.homeTeam.name,
            "vs",
            freshMatch.awayTeam.name
          );
          result.push(freshMatch);
        } else {
          // ❌ Not in fresh data - use CACHED data as fallback
          const cachedMatch = getCachedMatchData(matchId);
          if (cachedMatch) {
            console.log(
              `💾 Using cached data for ${matchId}:`,
              cachedMatch.homeTeam.name,
              "vs",
              cachedMatch.awayTeam.name
            );
            result.push(cachedMatch);
          } else {
            console.warn(
              `⚠️ No data found for ${matchId} (neither fresh nor cached)`
            );
          }
        }
      });

      console.log(
        `🌟 STARRED PAGE RESULT: ${result.length} matches (${matches.length} fresh available)`
      );
      return result;
    },
    [matches, starredMatchIds, getCachedMatchData]
  );

  // Debug logging
  useEffect(
    () => {
      if (starredMatchIds.length > 0) {
        console.log("====== STARRED PAGE DEBUG ======");
        console.log("📦 Starred IDs:", starredMatchIds);
        console.log("📊 Fresh matches available:", matches.length);
        console.log("✅ Showing matches:", starredMatches.length);

        const freshIds = new Set(matches.map(m => m.match_id));
        const using = starredMatchIds.map(id => ({
          id,
          source: freshIds.has(id) ? "FRESH ✅" : "CACHED 💾"
        }));
        console.table(using);
        console.log("================================");
      }
    },
    [starredMatchIds, matches, starredMatches]
  );

  // Group starred matches by league
  const groupedMatches = useMemo(
    () => {
      const groups: Record<string, { name: string; country: string; logo?: string; matches: typeof matches; ccd?: string; scd?: string }> = {}; // ← ADD THIS // ← ADD THIS

      starredMatches.forEach(match => {
        const leagueId = match.league.id;
        if (!groups[leagueId]) {
          groups[leagueId] = { name: match.league.name, country: match.league.country, logo: match.league.logo, ccd: match.league.ccd, scd: match.league.scd, matches: [] }; // ← ADD THIS // ← ADD THIS
        }
        groups[leagueId].matches.push(match);
      });

      // Sort matches by time within each league
      Object.values(groups).forEach(group => {
        group.matches.sort(
          (a, b) =>
            new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      });

      return groups;
    },
    [starredMatches]
  );

  // Count how many are using cached vs fresh data
  const freshCount = useMemo(
    () => {
      const freshIds = new Set(matches.map(m => m.match_id));
      return starredMatchIds.filter(id => freshIds.has(id)).length;
    },
    [matches, starredMatchIds]
  );

  const cachedCount = starredMatches.length - freshCount;

  return <div className="min-h-screen bg-zoro-dark">
      <Header starredCount={getStarredCount()} />

      <main className="container mx-auto px-2 py-2 max-w-4xl">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-md font-bold text-zoro-white mb-1">
                Starred Matches
              </h1>
              <p className="text-zoro-grey text-sm">
                {getStarredCount()} {getStarredCount() === 1 ? "match" : "matches"} saved
              </p>
            </div>
            {getStarredCount() > 0 && <button onClick={clearAllStarred} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-semibold text-sm transition-all">
                Clear All
              </button>}
          </div>
        </div>

        {/* Loading indicator */}
        {loading && <LoadingSpinner />}

        {/* Error */}
        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
            ⚠️ {error}
            {/* {starredMatches.length > 0 &&
              <p className="text-sm mt-2 text-zoro-grey">
                Showing cached data while trying to reconnect...
              </p>} */}
          </div>}

        {/* Empty State */}
        {getStarredCount() === 0 && <div className="text-center text-zoro-grey py-12">
            <p className="text-md border border-zoro-border bg-zoro-card rounded-xl p-6 inline-block">
              Tap the <span>⭐ </span> star to add matches here.
            </p>
          </div>}

        {/* Starred Matches Display */}
        {starredMatches.length > 0 && <div>
            {Object.entries(groupedMatches).map(([leagueId, group]) =>
              <LeagueSection
                key={leagueId}
                leagueId={leagueId}
                leagueName={group.name}
                leagueCountry={group.country}
                leagueLogo={group.logo}
                ccd={group.ccd} // ← ADD THIS
                scd={group.scd} // ← ADD THIS
                matches={group.matches}
                isStarred={isStarred}
                onToggleStar={toggleStar}
              />
            )}
          </div>}

        {/* Info Footer */}
        {/* {starredMatches.length > 0 &&
          <div className="text-center text-xs text-zoro-grey mt-8 flex items-center justify-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zoro-yellow opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-zoro-yellow" />
            </span>
            {freshCount > 0
              ? "Updating automatically"
              : "Will update when match data is available"}
          </div>} */}
      </main>
    </div>;
}
