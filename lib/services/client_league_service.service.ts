/**
 * Client-side service for fetching league data from Next.js API
 * This calls the backend API route, NOT the LiveScore API directly
 */

import { ComprehensiveLeagueData } from "@/lib/services/comprehensive_league_service.service";

/**
 * Fetch comprehensive league data from backend API
 */
export async function fetchLeagueData(
  compId: string
): Promise<ComprehensiveLeagueData | null> {
  try {
    const response = await fetch(`/api/leagues/${compId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
      // Use Next.js cache with revalidation
      next: {
        revalidate: 30 // Revalidate every 30 seconds
      }
    });

    if (!response.ok) {
      console.error(`Failed to fetch league data: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching league data:", error);
    return null;
  }
}

/**
 * Client-side wrapper with better error handling
 */
export async function getLeagueData(
  compId: string
): Promise<{
  data: ComprehensiveLeagueData | null;
  error: string | null;
}> {
  try {
    const data = await fetchLeagueData(compId);

    if (!data) {
      return {
        data: null,
        error: "Failed to fetch league data"
      };
    }

    return {
      data,
      error: null
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
