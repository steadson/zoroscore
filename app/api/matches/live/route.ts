import { NextResponse } from "next/server";
import { getLiveMatches } from "@/lib/services/match.service";

/**
 * Get all live matches
 * GET /api/matches/live
 */
export async function GET() {
  try {
    const matches = await getLiveMatches();

    return NextResponse.json({
      success: true,
      count: matches.length,
      matches,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching live matches:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
