import { NextResponse } from "next/server";
import { loadMatchesFromDb, matchCache } from "@/lib/services/match.service";

/**
 * Startup sync - Load matches from DB to memory on server start
 * Call this once when the server starts
 */
export async function GET() {
  try {
    console.log("🚀 Startup sync: Loading matches from database...");

    // Load from database
    const matches = await loadMatchesFromDb();

    if (matches.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No matches in database, cache remains empty",
        loaded: 0
      });
    }

    // Populate memory cache
    matchCache.setMatches(matches);

    console.log(`✅ Loaded ${matches.length} matches into memory cache`);

    return NextResponse.json({
      success: true,
      message: "Matches loaded from database to memory",
      loaded: matches.length,
      stats: matchCache.getStats()
    });
  } catch (error) {
    console.error("❌ Startup sync failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
