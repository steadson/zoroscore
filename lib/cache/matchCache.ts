import { Match } from "@/lib/types";

/**
 * In-memory cache for matches
 * Primary data source for fast access
 */
class MatchCache {
  private matches: Map<string, Match> = new Map();
  private lastSync: Date | null = null;
  private lastDbSync: Date | null = null;

  /**
   * Set a single match
   */
  setMatch(match: Match): void {
    this.matches.set(match.match_id, match);
  }

  /**
   * Set multiple matches (replaces all)
   */
  setMatches(matches: Match[]): void {
    this.matches.clear();
    matches.forEach(match => {
      this.matches.set(match.match_id, match);
    });
    this.lastSync = new Date();
  }

  /**
   * Update multiple matches (merges with existing)
   */
  updateMatches(matches: Match[]): void {
    matches.forEach(match => {
      this.matches.set(match.match_id, match);
    });
    this.lastSync = new Date();
  }

  /**
   * Get a single match by ID
   */
  getMatch(matchId: string): Match | undefined {
    return this.matches.get(matchId);
  }

  /**
   * Get all matches
   */
  getAllMatches(): Match[] {
    return Array.from(this.matches.values());
  }

  /**
   * Get matches by status
   */
  getMatchesByStatus(status: Match["status"]): Match[] {
    return this.getAllMatches().filter(match => match.status === status);
  }

  /**
   * Get live matches
   */
  getLiveMatches(): Match[] {
    return this.getAllMatches().filter(
      match => match.status === "live" || match.status === "halftime"
    );
  }

  /**
   * Get today's matches
   */
  getTodayMatches(): Match[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getAllMatches().filter(match => {
      const matchTime = new Date(match.startTime);
      return matchTime >= today && matchTime < tomorrow;
    });
  }

  /**
   * Get matches grouped by league
   */
  getMatchesGroupedByLeague(): Record<string, Match[]> {
    const grouped: Record<string, Match[]> = {};

    this.getAllMatches().forEach(match => {
      const leagueId = match.league.id;
      if (!grouped[leagueId]) {
        grouped[leagueId] = [];
      }
      grouped[leagueId].push(match);
    });

    return grouped;
  }

  /**
   * Check if cache is empty
   */
  isEmpty(): boolean {
    return this.matches.size === 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const matches = this.getAllMatches();
    return {
      total: matches.length,
      live: matches.filter(m => m.status === "live").length,
      finished: matches.filter(m => m.status === "finished").length,
      upcoming: matches.filter(m => m.status === "upcoming").length,
      halftime: matches.filter(m => m.status === "halftime").length,
      lastSync: this.lastSync,
      lastDbSync: this.lastDbSync
    };
  }

  /**
   * Set last DB sync time
   */
  setLastDbSync(): void {
    this.lastDbSync = new Date();
  }

  /**
   * Check if it's time to sync to DB (every 15 minutes)
   */
  shouldSyncToDb(): boolean {
    if (!this.lastDbSync) return true;

    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    return this.lastDbSync < fifteenMinutesAgo;
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.matches.clear();
    this.lastSync = null;
  }
}

// Global singleton instance
const matchCache = new MatchCache();

export default matchCache;
