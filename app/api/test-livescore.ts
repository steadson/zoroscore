import { NextRequest, NextResponse } from "next/server";
import {
  fetchTodayMatches,
  fetchMatchesByDate,
  filterMatchesByStatus
} from "@/lib/services/livescore.service";
import { getTodayLiveScoreFormat } from "@/lib/utils/date";

/**
 * Test endpoint for LiveScore API integration
 * 
 * Usage:
 * GET /api/test-livescore - Fetch today's matches
 * GET /api/test-livescore?date=20251027 - Fetch specific date
 * GET /api/test-livescore?status=live - Filter by status
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    console.log("🧪 Testing LiveScore API...");
    console.log("Parameters:", { date, status });

    // Fetch matches
    let matches = date
      ? await fetchMatchesByDate(date)
      : await fetchTodayMatches();

    // Filter by status if provided
    if (status) {
      matches = filterMatchesByStatus(matches, status as any);
    }

    // Prepare response with statistics
    const stats = {
      total: matches.length,
      live: matches.filter(m => m.status === "live").length,
      finished: matches.filter(m => m.status === "finished").length,
      upcoming: matches.filter(m => m.status === "upcoming").length
    };

    const leagues = [...new Set(matches.map(m => m.league.name))].sort();

    return NextResponse.json(
      {
        success: true,
        message: "LiveScore API test successful",
        date: date || getTodayLiveScoreFormat(),
        stats,
        leagues,
        matches: matches.slice(0, 10), // Return first 10 for testing
        sample: matches[0] || null // Show one full match object
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("❌ LiveScore API test failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to fetch matches from LiveScore API"
      },
      { status: 500 }
    );
  }
}
