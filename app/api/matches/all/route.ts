import { NextRequest, NextResponse } from "next/server";
import {
  getAllMatches,
  getMatchesByStatus,
  getTodayMatches,
  getMatchesGroupedByLeague
} from "@/lib/services/match.service";

/**
 * Get matches with optional filters
 * GET /api/matches/all
 * 
 * Query params:
 * - status: live | finished | upcoming | halftime
 * - today: true (only today's matches)
 * - grouped: true (group by league)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const today = searchParams.get("today");
    const grouped = searchParams.get("grouped");

    let matches;

    // Filter by status
    if (status) {
      matches = await getMatchesByStatus(status as any);
    } else if (today === "true") {
      // Only today's matches
      matches = await getTodayMatches();
    } else if (grouped === "true") {
      // Grouped by league
      const groupedMatches = await getMatchesGroupedByLeague();
      return NextResponse.json({
        success: true,
        grouped: true,
        leagues: Object.keys(groupedMatches).length,
        matches: groupedMatches,
        timestamp: new Date().toISOString()
      });
    } else {
      // All matches
      matches = await getAllMatches();
    }

    return NextResponse.json({
      success: true,
      count: matches.length,
      matches,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching matches:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
