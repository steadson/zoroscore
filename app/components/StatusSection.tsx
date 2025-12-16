"use client";

import { Match } from "@/lib/types";
import MatchCardWithLeagueHeader from "./MatchCardWithLeagueHeader";
import { useState } from "react";

interface StatusSectionProps {
  statusName: string;
  statusIcon: string;
  matches: Match[];
  isStarred?: (matchId: string) => boolean;
  onToggleStar?: (matchId: string) => void;
}

export default function StatusSection({
  statusName,
  statusIcon,
  matches,
  isStarred,
  onToggleStar
}: StatusSectionProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-1">
      {/* Status Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center mb-1 w-full bg-zoro-yellow/10 hover:bg-zoro-yellow/20 rounded-lg py-2 transition-colors border-zoro-yellow/30"
      >
        <div className="h-8 from-zoro-yellow to-zoro-green rounded-full" />

        <div className="flex items-center gap-2 ml-2">
          <span className="text-lg">
            {statusIcon}
          </span>
          <h2 className="font-bold text-zoro-white text-sm">
            {statusName}
          </h2>
        </div>

        <div className="flex items-center gap-2 mr-2 ml-auto">
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
        </div>
      </button>

      {/* Matches with League Headers */}
      {isExpanded &&
        <div className="space-y-2">
          {matches.map((match, index) => {
            // Show league header if:
            // 1. First match, OR
            // 2. Different league from previous match
            const showLeagueHeader =
              index === 0 || match.league.id !== matches[index - 1].league.id;

            return (
              <MatchCardWithLeagueHeader
                key={match.match_id}
                match={match}
                showLeagueHeader={showLeagueHeader}
                isStarred={isStarred ? isStarred(match.match_id) : false}
                onToggleStar={onToggleStar}
              />
            );
          })}
        </div>}
    </div>
  );
}
