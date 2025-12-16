import { NextRequest, NextResponse } from "next/server";
import { fetchLiveMatchesFromAPI } from "@/lib/services/livescore.service";

export async function GET(request: NextRequest) {
  try {
    const matches = await fetchLiveMatchesFromAPI();

    return NextResponse.json({
      success: true,
      count: matches.length,
      matches,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
