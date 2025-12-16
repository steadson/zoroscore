// app/api/league/[compId]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { fetchLeagueDetailsWithFallback } from "@/lib/services/league.service";

/**
 * GET /api/league/[compId]

 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ compId: string }> }) {
               try {
                  const { compId } = await params;
                 const searchParams = request.nextUrl.searchParams;
                 const ccd = searchParams.get("ccd");
                 const scd = searchParams.get("scd");

                 console.log(`📊 League API called - CompId: ${compId}, Ccd: ${ccd}, Scd: ${scd}`);

                 // Validate that we have fallback data
                 if ((!compId || compId === "undefined") && (!ccd || !scd)) {
                   return NextResponse.json({ success: false, error: "Missing required parameters: CompId or (Ccd + Scd) required" }, { status: 400 });
                 }

                 // Try to fetch league details with fallback
                 const leagueData = await fetchLeagueDetailsWithFallback(compId !== "undefined" ? compId : undefined, ccd || "", scd || "");

                 // If both methods failed, return 404
                 if (!leagueData) {
                   return NextResponse.json({ success: false, error: "League not found", message: `No data found for CompId: ${compId}, Ccd: ${ccd}, Scd: ${scd}` }, { status: 404 });
                 }

                 // Success!
                 return NextResponse.json({
                   success: true,
                   data: leagueData,
                   method:
                     compId && compId !== "undefined"
                       ? "compId"
                       : "ccd/scd",
                   timestamp: new Date().toISOString()
                 });
               } catch (error) {
                 console.error("❌ League API error:", error);

                 return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Unknown error", message: "Failed to fetch league details" }, { status: 500 });
               }
             }
