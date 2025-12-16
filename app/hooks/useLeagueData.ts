"use client";

import { useState, useEffect } from "react";
import { ComprehensiveLeagueData } from "@/lib/services/comprehensive_league_service.service";
import { fetchLeagueData } from "@/lib/services/client_league_service.service";

interface UseLeagueDataOptions {
  compId: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export function useLeagueData({
  compId,
  autoRefresh = true,
  refreshInterval = 60000 // 1 minute default
}: UseLeagueDataOptions) {
  const [data, setData] = useState<ComprehensiveLeagueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = async () => {
    try {
      // Don't show loading spinner on refresh if we already have data
      if (!data) {
        setLoading(true);
      }
      setError(null);

      const result = await fetchLeagueData(compId);

      if (result) {
        setData(result);
        setLastUpdated(new Date());
      } else {
        setError("Failed to fetch league data");
      }
    } catch (err) {
      console.error("Error fetching league data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(
    () => {
      fetchData();

      if (autoRefresh) {
        const interval = setInterval(() => {
          fetchData();
        }, refreshInterval);

        return () => clearInterval(interval);
      }
    },
    [compId, autoRefresh, refreshInterval]
  );

  return {
    data,
    loading,
    error,
    lastUpdated,
    refetch: fetchData
  };
}
