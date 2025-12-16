import { NextResponse } from "next/server";
import { getMatchesByStatus } from "@/lib/services/match.service";

/**
 * Get all finished matches
 * GET /api/matches/finished
 */
export async function GET() {
  try {
    const matches = await getMatchesByStatus("finished");

    return NextResponse.json({
      success: true,
      count: matches.length,
      matches,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching finished matches:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
