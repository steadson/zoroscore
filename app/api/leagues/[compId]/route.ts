// app/api/leagues/[compId]/route.ts

import { NextRequest, NextResponse } from "next/server";

import { fetchComprehensiveLeagueData } from "@/lib/services/comprehensive_league_service.service";

/**
 * GET /api/leagues/[compId]
 * Fetch comprehensive league data (details, stats, table, matches)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ compId: string }> }
) {
  try {
    const { compId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const ccd = searchParams.get("ccd");
    const scd = searchParams.get("scd");

    console.log(
      `📊 Comprehensive League API called - CompId: ${compId}, Ccd: ${ccd}, Scd: ${scd}`
    );

    // Validate parameters
    if ((!compId || compId === "undefined") && (!ccd || !scd)) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters: CompId or (Ccd + Scd) required"
        },
        { status: 400 }
      );
    }

    // Fetch comprehensive league data with fallback
    const data = await fetchComprehensiveLeagueData(
      compId !== "undefined" ? compId : undefined,
      ccd || undefined,
      scd || undefined
    );

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: "League data not found",
          message: `No data found for CompId: ${compId}, Ccd: ${ccd}, Scd: ${scd}`
        },
        { status: 404 }
      );
    }

    // Success - return comprehensive data
    return NextResponse.json(
      {
        success: true,
        data,
        timestamp: new Date().toISOString()
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60"
        }
      }
    );
  } catch (error) {
    console.error("❌ Comprehensive League API error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Failed to fetch comprehensive league data"
      },
      { status: 500 }
    );
  }
}
