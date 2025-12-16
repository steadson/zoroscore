import { Match } from "@/lib/types";
import { parseLiveScoreDate } from "@/lib/utils/date";
import { parseEventStatus, getTeamLogoUrl } from "@/lib/services/league.service";

/**
 * Convert a league event to a Match object
 * This is needed when starring matches from the league page
 */
export function convertLeagueEventToMatch(
  event: any,
  leagueInfo: {
    id: string;
    name: string;
    country: string;
    logo?: string;
  }
): Match {
  const startTime = parseLiveScoreDate(event.Esd);
  const status = parseEventStatus(event.Eps);

  // Build team objects
  const homeTeam = {
    id: event.T1[0]?.ID || "unknown",
    name: event.T1[0]?.Nm || "Unknown Team",
    logo: event.T1[0]?.Img ? getTeamLogoUrl(event.T1[0].Img) : undefined,
    shortName: event.T1[0]?.Abr,
  };

  const awayTeam = {
    id: event.T2[0]?.ID || "unknown",
    name: event.T2[0]?.Nm || "Unknown Team",
    logo: event.T2[0]?.Img ? getTeamLogoUrl(event.T2[0].Img) : undefined,
    shortName: event.T2[0]?.Abr,
  };

  // Build score object
  const score = {
    home: parseInt(event.Tr1 || "0"),
    away: parseInt(event.Tr2 || "0"),
    halfTime:
      event.Trh1 && event.Trh2
        ? {
            home: parseInt(event.Trh1),
            away: parseInt(event.Trh2),
          }
        : undefined,
  };

  // Create Match object
  const match: Match = {
    match_id: String(event.Eid),
    homeTeam,
    awayTeam,
    score,
    status,
    startTime,
    league: leagueInfo,
    events: [], // We don't have detailed events from league view
    stats: undefined,
    minute: undefined,
    addedTime: undefined,
    lastUpdated: new Date(),
  };

  return match;
}