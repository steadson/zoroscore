import Link from "next/link";
import Image from "next/image";

interface LeagueLinkProps {
  leagueId: string;
  leagueName: string;
  leagueCountry?: string;
  leagueLogo?: string;
  showCountry?: boolean;
  className?: string;
  // NEW: Add Ccd and Scd for fallback
  ccd?: string;
  scd?: string;
}

/**
 * Clickable league name component that navigates to league detail page
 * Now supports fallback using Ccd/Scd when CompId is unavailable
 */
export default function LeagueLink({
  leagueId,
  leagueName,
  leagueCountry,
  leagueLogo,
  showCountry = false,
  className = "",
  ccd,
  scd
}: LeagueLinkProps) {
  // Build URL with query params for fallback
  const buildUrl = () => {
    const baseUrl = `/league/${leagueId || 'details'}`;

    // Add ccd and scd as query params for API fallback
    if (ccd && scd) {
      return `${baseUrl}?ccd=${encodeURIComponent(
        ccd
      )}&scd=${encodeURIComponent(scd)}`;
    }

    return baseUrl;
  };

  return (
    <Link
      href={buildUrl()}
      className={`group inline-flex items-center gap-2 hover:text-zoro-yellow transition-colors ${className}`}
    >
      {leagueLogo &&
        <div className="relative w-4 h-4 flex-shrink-0">
          <Image
            src={leagueLogo}
            alt={leagueName}
            fill
            className="object-contain"
            unoptimized
          />
        </div>}

      <div className="flex flex-col">
        <span className="font-bold text-sm group-hover:underline">
          {leagueName}
        </span>
        {showCountry &&
          leagueCountry &&
          <span className="text-xs text-zoro-grey">
            {leagueCountry}
          </span>}
      </div>
    </Link>
  );
}
