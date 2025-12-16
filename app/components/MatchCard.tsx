import Image from "next/image";
import { Match } from "@/lib/types";
import LiveIndicator from "./LiveIndicator";
import { formatDisplayTime } from "@/lib/utils/date";

interface MatchCardProps {
  match: Match;
  isStarred?: boolean;
  onToggleStar?: (matchId: string, matchData?: Match) => void;
}

export default function MatchCard({
  match,
  isStarred = false,
  onToggleStar
}: MatchCardProps) {
  const isLive = match.status === "live" || match.status === "halftime";
  const isFinished = match.status === "finished";
  const isUpcoming = match.status === "upcoming";

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (onToggleStar) {
      onToggleStar(match.match_id, match); // ← Pass full match
    }
  };

  return (
    <div
      className={`
      bg-zoro-card rounded-xl shadow-lg  p-2 
      hover:bg-zoro-card/80 hover:shadow-xl transition-all cursor-pointer
      ${isLive
        ? "border-zoro-green/50 shadow-zoro-green/10"
        : "border-zoro-border"}
    `}
    >
      {/* Time, Star and Status */}
      <div className="flex items-center justify-between ">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zoro-grey">
            {formatDisplayTime(match.startTime)}
          </span>
          {/* Star Icon */}
          <button
            onClick={handleStarClick}
            className="hover:scale-110 transition-transform"
            aria-label={isStarred ? "Unstar match" : "Star match"}
          >
            {isStarred
              ? <svg
                  className="w-4 h-4 text-zoro-yellow fill-zoro-yellow"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              : <svg
                  className="w-4 h-4 text-zoro-grey hover:text-zoro-yellow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>}
          </button>
        </div>
        <LiveIndicator
          minute={match.minute}
          addedTime={match.addedTime}
          status={match.status}
        />
      </div>

      {/* Teams and Scores */}
      <div className="">
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {match.homeTeam.logo
              ? <div className="relative w-4 h-4 flex-shrink-0 bg-white/5 rounded-full p-1">
                  <Image
                    src={match.homeTeam.logo}
                    alt={match.homeTeam.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              : <div className="w-4 h-4 flex-shrink-0 bg-zoro-border rounded-full flex items-center justify-center text-xs">
                  ⚽
                </div>}
            <span
              className={`
              truncate text-sm
              ${isLive
                ? "font-bold text-zoro-white"
                : "font-medium text-zoro-grey"}
            `}
            >
              {match.homeTeam.name}
            </span>
          </div>
          <span
            className={`
            text-sm font-bold ml-3 w-10 text-right
            ${isLive ? "text-zoro-white" : "text-zoro-grey"}
          `}
          >
            {isUpcoming ? "-" : match.score.home}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {match.awayTeam.logo
              ? <div className="relative w-4 h-4 flex-shrink-0 bg-white/5 rounded-full p-1">
                  <Image
                    src={match.awayTeam.logo}
                    alt={match.awayTeam.name}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              : <div className="w-4 h-4 flex-shrink-0 bg-zoro-border rounded-full flex items-center justify-center text-xs">
                  ⚽
                </div>}
            <span
              className={`
              truncate text-sm
              ${isLive
                ? "font-bold text-zoro-white"
                : "font-medium text-zoro-grey"}
            `}
            >
              {match.awayTeam.name}
            </span>
          </div>
          <span
            className={`
            text-sm font-bold ml-3 w-10 text-right
            ${isLive ? "text-zoro-white" : "text-zoro-grey"}
          `}
          >
            {isUpcoming ? "-" : match.score.away}
          </span>
        </div>
      </div>

      {/* Halftime Score (if available) */}
      {match.score.halfTime &&
        isFinished &&
        <div className="mt-2 pt-1 border-t border-zoro-border">
          <span className="text-xs text-zoro-grey">
            HT: {match.score.halfTime.home} - {match.score.halfTime.away}
          </span>
        </div>}

      {/* Live indicator bar */}
      {isLive &&
        <div className="mt-2 pt-1 border-t border-zoro-border">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-zoro-border rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-zoro-green to-zoro-yellow w-3/4 animate-pulse" />
            </div>
            <span className="text-xs text-zoro-green font-semibold">LIVE</span>
          </div>
        </div>}
    </div>
  );
}
