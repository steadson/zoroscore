"use client";

import { Match } from "@/lib/types";
import MatchCard from "./MatchCard";
import { useState } from "react";
import LeagueLink from "./LeagueLink";

interface LeagueSectionProps {
  leagueId: string;
  leagueName: string;
  leagueCountry: string;
  leagueLogo?: string;
  matches: Match[];
  isStarred?: (matchId: string) => boolean;
  onToggleStar?: (matchId: string) => void;
  // NEW: Add Ccd and Scd for fallback
  ccd?: string;
  scd?: string;
}

export default function LeagueSection({
  leagueId,
  leagueName,
  leagueCountry,
  leagueLogo,
  matches,
  isStarred,
  onToggleStar,
  ccd,
  scd
}: LeagueSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-1">
      {/* League Header - Now includes clickable link */}
      <div className="flex items-center mb-1 w-full bg-zoro-yellow/10 hover:bg-zoro-yellow/20 rounded-lg py-2 transition-colors border-zoro-yellow/30">
        <div className="h-8 from-zoro-yellow to-zoro-green rounded-full" />

        {/* Clickable League Name */}
        <div className="flex-1 ml-2">
          <LeagueLink
            leagueId={leagueId}
            leagueName={leagueName}
            leagueCountry={leagueCountry}
            leagueLogo={leagueLogo}
            showCountry={true}
            className="text-zoro-white"
            ccd={ccd} // ← PASS THIS
            scd={scd} // ← PASS THIS
          />
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 mr-2 px-2 hover:bg-zoro-yellow/10 rounded transition-colors"
        >
          <span className="text-xs text-zoro-grey font-semibold">
            {matches.length} {matches.length === 1 ? "match" : "matches"}
          </span>
          <svg
            className={`w-5 h-5 text-zoro-grey transition-transform ${isExpanded
              ? "rotate-180"
              : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      {/* Matches */}
      {isExpanded &&
        <div className="space-y-2">
          {matches.map(match =>
            <MatchCard
              key={match.match_id}
              match={match}
              isStarred={isStarred ? isStarred(match.match_id) : false}
              onToggleStar={onToggleStar}
            />
          )}
        </div>}
    </div>
  );
}
