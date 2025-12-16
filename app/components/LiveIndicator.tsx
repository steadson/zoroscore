interface LiveIndicatorProps {
  minute?: number;
  addedTime?: number;
  status:
    | "live"
    | "halftime"
    | "finished"
    | "upcoming"
    | "postponed"
    | "cancelled";
}

export default function LiveIndicator({
  minute,
  addedTime,
  status
}: LiveIndicatorProps) {
  if (status === "live") {
    const displayMinute = addedTime ? `${minute}+${addedTime}'` : `${minute}'`;
    return (
      <div className="flex items-center gap-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zoro-green opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-zoro-green" />
        </span>
        <span className="text-zoro-green font-bold text-xs">
          {displayMinute}
        </span>
      </div>
    );
  }

  if (status === "halftime") {
    return (
      <span className="text-zoro-yellow font-bold text-xs  bg-zoro-yellow/10 rounded  border-zoro-yellow/30">
        HT
      </span>
    );
  }

  if (status === "finished") {
    return (
      <span className="text-zoro-grey font-semibold text-xs text-zoro-green  bg-zoro-card rounded  border-zoro-border">
        FT
      </span>
    );
  }

  if (status === "upcoming") {
    return (
      <span className="text-zoro-grey font-semibold text-xs text-zoro-yellow bg-zoro-card rounded  border-zoro-border">
        UPCOMING
      </span>
    );
  }

  return null;
}
