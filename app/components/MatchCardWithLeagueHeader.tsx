"use client";

import { Match } from "@/lib/types";
import MatchCard from "./MatchCard";
import LeagueLink from "./LeagueLink";

interface MatchCardWithLeagueHeaderProps {
  match: Match;
  showLeagueHeader: boolean; // Only show if different from previous match
  isStarred?: boolean;
  onToggleStar?: (matchId: string) => void;
}

export default function MatchCardWithLeagueHeader({
  match,
  showLeagueHeader,
  isStarred = false,
  onToggleStar
}: MatchCardWithLeagueHeaderProps) {
  return (
    <div>
      {/* League Header - Only show if league changed */}
      {showLeagueHeader &&
        <div className="mb-2 mt-3 px-2">
          <LeagueLink
            leagueId={match.league.id}
            leagueName={match.league.name}
            leagueCountry={match.league.country}
            leagueLogo={match.league.logo}
            showCountry={true}
            className="text-zoro-white"
          />
        </div>}

      {/* Match Card */}
      <MatchCard
        match={match}
        isStarred={isStarred}
        onToggleStar={onToggleStar}
      />
    </div>
  );
}