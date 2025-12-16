"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Match } from "@/lib/types";
import Header from "@/app/components/Header";
import { convertLeagueEventToMatch } from "@/lib/utils/convertLeagueEventToMatch";
import { useStarredMatches } from "@/app/hooks/useStarredMatches";
import {
  LeagueDetails,
  getLeagueLogoUrl,
  getTeamLogoUrl,
  parseEventStatus
} from "@/lib/services/league.service";
import { formatDisplayTime, parseLiveScoreDate } from "@/lib/utils/date";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import EmptyState from "@/app/components/EmptyState";
import Image from "next/image";
import Link from "next/link";

import { StandingsTab, StatsTab } from "@/app/components/league/LeagueTabComponents";
import { ComprehensiveLeagueData } from "@/lib/services/comprehensive_league_service.service";

type TabType = "overview" | "fixtures" | "results" | "standings" | "stats";

export default function LeaguePage() {
  const params = useParams();
  const compId = params.compId as string;

  const [leagueData, setLeagueData] = useState<LeagueDetails | null>(null);
  const [comprehensiveData, setComprehensiveData] = useState<ComprehensiveLeagueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const { toggleStar, isStarred, getStarredCount } = useStarredMatches();

  useEffect(() => {
    const loadLeagueData = async () => {
      try {
        setLoading(true);
        
        const searchParams = new URLSearchParams(window.location.search);
        const ccd = searchParams.get('ccd');
        const scd = searchParams.get('scd');
        
        // Fetch comprehensive data (includes details + stats + table + matches)
        let comprehensiveUrl = `/api/leagues/${compId}`;
        if (ccd && scd) {
          comprehensiveUrl += `?ccd=${encodeURIComponent(ccd)}&scd=${encodeURIComponent(scd)}`;
        }
        
        const comprehensiveResponse = await fetch(comprehensiveUrl);
        
        if (comprehensiveResponse.ok) {
          const comprehensiveResult = await comprehensiveResponse.json();
          
          if (comprehensiveResult.success) {
            setComprehensiveData(comprehensiveResult.data);
            setError(null);
          }
        } else {
          // Fallback to basic league data if comprehensive fails
          let basicUrl = `/api/league/${compId}`;
          if (ccd && scd) {
            basicUrl += `?ccd=${encodeURIComponent(ccd)}&scd=${encodeURIComponent(scd)}`;
          }
          
          const basicResponse = await fetch(basicUrl);
          
          if (!basicResponse.ok) {
            throw new Error(`HTTP error! status: ${basicResponse.status}`);
          }
          
          const basicResult = await basicResponse.json();
          
          if (basicResult.success) {
            setLeagueData(basicResult.data);
            setError(null);
          } else {
            throw new Error(basicResult.error || "Failed to load league data");
          }
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load league data"
        );
        console.error("Error loading league data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (compId) {
      loadLeagueData();
    }
  }, [compId]);

  // Use comprehensive data if available, fallback to basic data
  const displayData = comprehensiveData?.details || leagueData;
  const logoUrl = displayData ? getLeagueLogoUrl(displayData.badgeUrl) : null;

  return (
    <div className="min-h-screen bg-zoro-dark">
      <Header starredCount={getStarredCount()} />

      {/* Mobile Layout */}
      <main className="lg:hidden container mx-auto px-2 py-4">
        {loading && <LoadingSpinner />}

        {error && (
          <div className="space-y-4">
            <EmptyState message={error} icon="⚠️" />
            <div className="text-center">
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-zoro-yellow text-zoro-dark rounded-lg font-semibold hover:bg-zoro-yellow/90 transition-colors"
              >
                Back to Home
              </Link>
            </div>
          </div>
        )}

        {!loading && !error && displayData && (
          <>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-zoro-grey hover:text-zoro-yellow mb-4 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-semibold">Back to Matches</span>
            </Link>

            {/* League Header */}
            <div className="bg-zoro-card rounded-xl p-4 mb-4 border border-zoro-border">
              <div className="flex items-center gap-4">
                {logoUrl && (
                  <div className="relative w-8 h-8 flex-shrink-0">
                    <Image
                      src={logoUrl}
                      alt={displayData.CompN}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                <div>
                  <h1 className="text-lg font-bold text-zoro-white">
                    {displayData.CompN}
                  </h1>
                  <p className="text-zoro-grey text-sm">{displayData.CompD}</p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 overflow-x-auto mb-4 scrollbar-thinner">
              {[
                { id: "overview" as const, label: "OVERVIEW" },
                { id: "fixtures" as const, label: "FIXTURES" },
                { id: "results" as const, label: "RESULTS" },
                { id: "standings" as const, label: "STANDINGS" },
                { id: "stats" as const, label: "STATS" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-2 py-2 font-semibold text-xs whitespace-nowrap transition-all border-b-2
                    ${activeTab === tab.id
                      ? "text-zoro-yellow border-zoro-yellow"
                      : "text-zoro-grey border-transparent hover:text-zoro-white hover:border-zoro-grey"
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === "overview" && (
                <OverviewTab 
                  leagueData={leagueData}
                  comprehensiveData={comprehensiveData}
                  logoUrl={logoUrl}
                  setActiveTab={setActiveTab} 
                  isStarred={isStarred}
                  onToggleStar={toggleStar} 
                />
              )}
              {activeTab === "fixtures" && (
                <FixturesTab 
                  leagueData={leagueData}
                  comprehensiveData={comprehensiveData}
                  logoUrl={logoUrl} 
                  isStarred={isStarred}
                  onToggleStar={toggleStar} 
                />
              )}
              {activeTab === "results" && (
                <ResultsTab 
                  leagueData={leagueData}
                  comprehensiveData={comprehensiveData}
                  logoUrl={logoUrl} 
                  isStarred={isStarred}
                  onToggleStar={toggleStar} 
                />
              )}
              {activeTab === "standings" && (
                comprehensiveData ? (
                  <StandingsTab
                    overall={comprehensiveData.table.overall}
                    home={comprehensiveData.table.home}
                    away={comprehensiveData.table.away}
                    form={comprehensiveData.table.form}
                  />
                ) : (
                  <StandingsTabOld leagueData={leagueData} />
                )
              )}
              {activeTab === "stats" && (
                comprehensiveData ? (
                  <StatsTab stats={comprehensiveData.stats} />
                ) : (
                  <StatsTabOld leagueData={leagueData} />
                )
              )}
            </div>
          </>
        )}
      </main>

      {/* Desktop Layout */}
      <main className="hidden lg:flex container mx-auto max-w-[1920px]">
        {/* Left Half */}
        <div className="w-1/2 flex mt-6">
          {/* Sidebar */}
          <aside className="w-1/2 p-4">
            {loading && <LoadingSpinner />}

            {!loading && !error && displayData && (
              <div className="sticky top-20">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 text-zoro-grey hover:text-zoro-yellow mb-4 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-sm font-semibold">Back to Home</span>
                </Link>

                <div className="bg-zoro-card rounded-xl p-6 mb-4 border border-zoro-border">
                  <div className="flex flex-col items-center text-center gap-4">
                    {logoUrl && (
                      <div className="relative w-14 h-14">
                        <Image
                          src={logoUrl}
                          alt={displayData.CompN}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                    <div>
                      <h1 className="text-md font-bold text-zoro-white mb-1">
                        {displayData.CompN}
                      </h1>
                      <p className="text-zoro-grey text-sm">{displayData.CompD}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && <EmptyState message={error} icon="⚠️" />}
          </aside>

          {/* Main Content */}
          <div className="w-1/2 p-4">
            {loading && <LoadingSpinner />}

            {!loading && !error && displayData && (
              <>
                <div className="flex gap-4 mb-4 overflow-x-auto scrollbar-thin">
                  {[
                    { id: "overview" as const, label: "OVERVIEW" },
                    { id: "fixtures" as const, label: "FIXTURES" },
                    { id: "results" as const, label: "RESULTS" },
                    { id: "standings" as const, label: "STANDINGS" },
                    { id: "stats" as const, label: "STATS" }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        px-2 py-2 font-semibold text-xs whitespace-nowrap transition-all border-b-2
                        ${activeTab === tab.id
                          ? "text-zoro-yellow border-zoro-yellow"
                          : "text-zoro-grey border-transparent hover:text-zoro-white hover:border-zoro-grey"
                        }
                      `}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div>
                  {activeTab === "overview" && (
                    <OverviewTab 
                      leagueData={leagueData}
                      comprehensiveData={comprehensiveData}
                      logoUrl={logoUrl}
                      setActiveTab={setActiveTab} 
                      isStarred={isStarred}
                      onToggleStar={toggleStar} 
                    />
                  )}
                  {activeTab === "fixtures" && (
                    <FixturesTab 
                      leagueData={leagueData}
                      comprehensiveData={comprehensiveData}
                      logoUrl={logoUrl} 
                      isStarred={isStarred}
                      onToggleStar={toggleStar} 
                    />
                  )}
                  {activeTab === "results" && (
                    <ResultsTab 
                      leagueData={leagueData}
                      comprehensiveData={comprehensiveData}
                      logoUrl={logoUrl} 
                      isStarred={isStarred}
                      onToggleStar={toggleStar} 
                    />
                  )}
                  {activeTab === "standings" && (
                    comprehensiveData ? (
                      <StandingsTab
                        overall={comprehensiveData.table.overall}
                        home={comprehensiveData.table.home}
                        away={comprehensiveData.table.away}
                        form={comprehensiveData.table.form}
                      />
                    ) : (
                      <StandingsTabOld leagueData={leagueData} />
                    )
                  )}
                  {activeTab === "stats" && (
                    comprehensiveData ? (
                      <StatsTab stats={comprehensiveData.stats} />
                    ) : (
                      <StatsTabOld leagueData={leagueData} />
                    )
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Half - Ad Space */}
        <div className="w-1/2 bg-zoro-card/30">
          <div className="h-screen flex items-center justify-center">
            <div className="text-center text-zoro-grey">
              {/* Ad space placeholder */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Overview Tab Component
// Updated Overview Tab with comprehensive data support
function OverviewTab({
  leagueData,
  comprehensiveData,
  logoUrl,
  setActiveTab,
  isStarred,
  onToggleStar
}: {
  leagueData: LeagueDetails | null;
  comprehensiveData: ComprehensiveLeagueData | null;
  logoUrl: string;
  setActiveTab: (tab: TabType) => void;
  isStarred: (id: string) => boolean;
  onToggleStar: (id: string, matchData?: Match) => void;
}) {
  // Use comprehensive data if available, fallback to basic league data
  const recentMatches = comprehensiveData
    ? comprehensiveData.matches.results.slice(0, 5)
    : leagueData?.Stages?.[0]?.Events?.slice(0, 5).filter(
        event => parseEventStatus(event.Eps) === "finished"
      ) || [];

  const upcomingMatches = comprehensiveData
    ? comprehensiveData.matches.upcoming.slice(0, 5)
    : leagueData?.Stages?.[0]?.Events?.slice(0, 5).filter(
        event => parseEventStatus(event.Eps) === "upcoming"
      ) || [];

  const standings = comprehensiveData
    ? comprehensiveData.table.overall.slice(0, 6)
    : leagueData?.Tables?.[0]?.team.slice(0, 6) || [];

  return (
    <div className="space-y-6">
      {/* Recent Results */}
      {recentMatches.length > 0 && (
        <div>
          <button
            onClick={() => setActiveTab("results")}
            className="text-sm font-bold text-zoro-white mb-3 hover:text-zoro-yellow transition-colors flex items-center gap-2"
          >
            Recent Results
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="bg-zoro-card rounded-xl p-4 border border-zoro-border">
            <div className="space-y-2">
              {recentMatches.map((item: any) => {
                // Handle both comprehensive and basic data formats
                const event = 'Eid' in item ? item : null;
                const match = 'matchId' in item ? item : null;
                
                return event ? (
                  <LeagueMatchCard 
                    key={event.Eid} 
                    event={event}
                    leagueInfo={{
                      id: leagueData?.CompId || 'unknown',
                      name: leagueData?.CompN || '',
                      country: leagueData?.CompD || '',
                      logo: logoUrl || "no-logo"
                    }}
                    isStarred={isStarred(String(event.Eid))}
                    onToggleStar={onToggleStar} 
                  />
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Fixtures */}
      {upcomingMatches.length > 0 && (
        <div>
          <button
            onClick={() => setActiveTab("fixtures")}
            className="text-sm font-bold text-zoro-white mb-3 hover:text-zoro-yellow transition-colors flex items-center gap-2"
          >
            Fixtures
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <div className="bg-zoro-card rounded-xl p-4 border border-zoro-border">
            <div className="space-y-2">
              {upcomingMatches.map((item: any) => {
                const event = 'Eid' in item ? item : null;
                
                return event ? (
                  <LeagueMatchCard 
                    key={event.Eid} 
                    event={event}
                    leagueInfo={{
                      id: leagueData?.CompId || 'unknown',
                      name: leagueData?.CompN || '',
                      country: leagueData?.CompD || '',
                      logo: logoUrl || undefined
                    }}
                    isStarred={isStarred(String(event.Eid))}
                    onToggleStar={onToggleStar} 
                  />
                ) : null;
              })}
            </div>
          </div>
        </div>
      )}

      {/* League Table Preview */}
      {standings.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-zoro-white mb-3 flex items-center gap-2">
            Standings
          </h3>

          <div className="bg-zoro-card rounded-xl border border-zoro-border overflow-hidden">
            <div className="px-3 py-2 border-b border-zoro-border text-[11px] text-zoro-grey font-semibold flex">
              <div className="w-8 text-left">#</div>
              <div className="flex-1 text-left">Team</div>
              <div className="w-8 text-center">P</div>
              <div className="w-10 text-center">GD</div>
              <div className="w-10 text-center">Pts</div>
            </div>

            <div className="text-xs">
              {standings.map((team: any, index: number) => {
                // Handle both comprehensive and basic data formats
                const rank = team.rank || team.rnk;
                const teamId = team.teamId || team.Tid;
                const teamName = team.teamName || team.Tnm;
                const teamLogo = team.teamLogo || team.Img;
                const played = team.played || team.pld;
                const goalDifference = team.goalDifference || team.gd;
                const points = team.points || team.pts;

                const rankColor =
                  rank <= 4
                    ? "text-blue-400"
                    : rank >= (standings.length - 2)
                      ? "text-red-400"
                      : "text-zoro-grey";

                return (
                  <div
                    key={teamId}
                    className="flex items-center px-3 py-2 border-b border-zoro-border/60 last:border-b-0 hover:bg-zoro-card/70 transition"
                  >
                    <div className={`w-8 text-left font-bold ${rankColor}`}>
                      {rank}
                    </div>

                    <div className="flex-1 flex items-center gap-2 min-w-0">
                      {teamLogo && (
                        <div className="relative w-5 h-5 flex-shrink-0">
                          <Image
                            src={getTeamLogoUrl(teamLogo) || ""}
                            alt={teamName}
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        </div>
                      )}
                      <span className="text-zoro-white font-semibold truncate">
                        {teamName}
                      </span>
                    </div>

                    <div className="w-8 text-center text-zoro-grey">
                      {played}
                    </div>

                    <div
                      className={`w-10 text-center font-semibold ${
                        goalDifference > 0
                          ? "text-zoro-green"
                          : goalDifference < 0
                            ? "text-red-400"
                            : "text-zoro-grey"
                      }`}
                    >
                      {goalDifference > 0 ? "+" : ""}
                      {goalDifference}
                    </div>

                    <div className="w-10 text-center text-zoro-white font-bold">
                      {points}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setActiveTab("standings")}
              className="w-full text-[11px] font-semibold text-zoro-yellow py-2 border-t border-zoro-border flex items-center justify-center gap-1 hover:bg-zoro-border/40 transition"
            >
              See all
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Fixtures Tab
function FixturesTab({ 
  leagueData,
  logoUrl,  // ← ADD
  isStarred,
  onToggleStar 
}: {
  leagueData: LeagueDetails |null;
  logoUrl: string ;  // ← ADD
  isStarred: (id: string) => boolean;
  onToggleStar: (id: string, matchData?: Match) => void;  // ← UPDATE
}) {
  const fixtures =
    leagueData?.Stages?.[0]?.Events?.filter(
      event => parseEventStatus(event.Eps) === "upcoming"
    ) || [];

  return (
    <div className="bg-zoro-card rounded-xl p-4 border border-zoro-border">
      <h2 className="text-xl font-bold text-zoro-white mb-4">
        All Fixtures
      </h2>
      {fixtures.length === 0 ? (
        <EmptyState message="No upcoming fixtures" icon="📅" />
      ) : (
        <div className="space-y-2">
          {fixtures.map(event => (
            <LeagueMatchCard key={event.Eid} event={event}
            leagueInfo={{
    id: leagueData?.CompId || 'unknown',
    name: leagueData?.CompN || 'unknown',
    country: leagueData?.CompD || 'unknown',
    logo: logoUrl

  }}
              isStarred={isStarred(String(event.Eid))}
              onToggleStar={onToggleStar} />
          ))}
        </div>
      )}
    </div>
  );
}

// Results Tab
function ResultsTab({ 
  leagueData,
  logoUrl,  // ← ADD
  isStarred,
  onToggleStar 
}: {
  leagueData: LeagueDetails |null;
  logoUrl: string| 'no-logo'  // ← ADD
  isStarred: (id: string) => boolean;
  onToggleStar: (id: string, matchData?: Match) => void;  // ← UPDATE
}) {
  const results =
    leagueData?.Stages?.[0]?.Events?.filter(
      event => parseEventStatus(event.Eps) === "finished"
    ) || [];

  return (
    <div className="bg-zoro-card rounded-xl p-4 border border-zoro-border">
      <h2 className="text-xl font-bold text-zoro-white mb-4">All Results</h2>
      {results.length === 0 ? (
        <EmptyState message="No results yet" icon="✅" />
      ) : (
        <div className="space-y-2">
          {results.map(event => (
            <LeagueMatchCard 
              key={event.Eid} 
              event={event}
              leagueInfo={{
                id: leagueData?.CompId || 'unknown',
                name: leagueData?.CompN || '',
                country: leagueData?.CompD || '',
                logo: logoUrl || '' // ← ADD leagueInfo
              }}
              isStarred={isStarred(String(event.Eid))}
              onToggleStar={onToggleStar} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Standings Tab
function StandingsTabOld({ leagueData }: { leagueData: LeagueDetails |null }) {
  if (!leagueData?.Tables || leagueData.Tables.length === 0) {
    return (
      <div className="bg-zoro-card rounded-xl p-4 border border-zoro-border">
        <EmptyState message="No standings available" icon="🏆" />
      </div>
    );
  }

  return (
    <div className="bg-zoro-card rounded-xl p-4 overflow-x-auto border border-zoro-border">
      <h2 className="text-xl font-bold text-zoro-white mb-4">
        League Table
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zoro-border">
            <th className="text-left py-2 text-zoro-grey font-semibold">#</th>
            <th className="text-left py-2 text-zoro-grey font-semibold">
              Team
            </th>
            <th className="text-center py-2 text-zoro-grey font-semibold">
              P
            </th>
            <th className="text-center py-2 text-zoro-grey font-semibold">
              W
            </th>
            <th className="text-center py-2 text-zoro-grey font-semibold">
              D
            </th>
            <th className="text-center py-2 text-zoro-grey font-semibold">
              L
            </th>
            <th className="text-center py-2 text-zoro-grey font-semibold">
              GF
            </th>
            <th className="text-center py-2 text-zoro-grey font-semibold">
              GA
            </th>
            <th className="text-center py-2 text-zoro-grey font-semibold">
              GD
            </th>
            <th className="text-center py-2 text-zoro-grey font-semibold">
              Pts
            </th>
          </tr>
        </thead>
        <tbody>
          {leagueData.Tables[0].team.map(team => (
            <tr key={team.Tid} className="border-b border-zoro-border/50">
              <td className="py-3 text-zoro-white font-bold">
                {team.rnk}
              </td>
              <td className="py-3">
                <div className="flex items-center gap-2">
                  {team.Img && (
                    <div className="relative w-5 h-5">
                      <Image
                        src={getTeamLogoUrl(team.Img) || ""}
                        alt={team.Tnm}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  )}
                  <span className="text-zoro-white font-semibold">
                    {team.Tnm}
                  </span>
                </div>
              </td>
              <td className="text-center py-3 text-zoro-grey">
                {team.pld}
              </td>
              <td className="text-center py-3 text-zoro-grey">
                {team.win}
              </td>
              <td className="text-center py-3 text-zoro-grey">
                {team.drw}
              </td>
              <td className="text-center py-3 text-zoro-grey">
                {team.lst}
              </td>
              <td className="text-center py-3 text-zoro-grey">
                {team.gf}
              </td>
              <td className="text-center py-3 text-zoro-grey">
                {team.ga}
              </td>
              <td
                className={`text-center py-3 font-semibold ${team.gd > 0
                    ? "text-zoro-green"
                    : team.gd < 0 ? "text-red-400" : "text-zoro-grey"
                  }`}
              >
                {team.gd > 0 ? "+" : ""}{team.gd}
              </td>
              <td className="text-center py-3 text-zoro-white font-bold">
                {team.pts}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Stats Tab
function StatsTabOld({ leagueData }: { leagueData: LeagueDetails | null}) {
  return (
    <div className="bg-zoro-card rounded-xl p-4 border border-zoro-border">
      <h2 className="text-xl font-bold text-zoro-white mb-4">Statistics</h2>
      <EmptyState message="Statistics coming soon..." icon="📊" />
    </div>
  );
}

// Reusable League Match Card (uses same design as homepage MatchCard)
function LeagueMatchCard({ 
  event, 
  leagueInfo, 
  isStarred = false,
  onToggleStar 
}: {
  event: any; 
  leagueInfo: { id: string; name: string; country: string; logo?: string }; 
  isStarred?: boolean;
  onToggleStar?: (id: string, matchData?: Match) => void;  // ← UPDATE
}) {
  const startTime = parseLiveScoreDate(event.Esd);
  const status = parseEventStatus(event.Eps);

  const isLive = status === "live" || status === "halftime";
  const isFinished = status === "finished";
  const isUpcoming = status === "upcoming";
  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleStar) {
      const matchData = convertLeagueEventToMatch(event, leagueInfo);
      onToggleStar(String(event.Eid), matchData);
    }
  };

  return (
    <div
      className={`
         rounded-lg shadow-lg p-2
        hover:bg-zoro-card/80 hover:shadow-xl transition-all cursor-pointer
        ${isLive
          ? "borde borde-zoro-green/50 shadow-zoro-green/10"
          : "border-b border-zoro-border"}
      `}
    >
      {/* Time + Star + Status */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-zoro-grey">
            {formatDisplayTime(startTime)}
          </span>

          {/* Star Icon */}
          <button
            onClick={handleStarClick}
            className="hover:scale-110 transition-transform"
            aria-label={isStarred ? "Unstar match" : "Star match"}
          >
            {isStarred ? (
              <svg
                className="w-4 h-4 text-zoro-yellow fill-zoro-yellow"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ) : (
              <svg
                className="w-4 h-4 text-zoro-grey hover:text-zoro-yellow"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
          </button>
        </div>

        {/* Status pill (unchanged) */}
        <span
          className={`
            text-[10px] font-semibold px-2 py-0.5 rounded-full
            ${status === "live"
              ? "bg-zoro-green/10 text-zoro-green border border-zoro-green/40"
              : status === "halftime"
                ? "text-zoro-yellow font-bold text-xs  bg-zoro-yellow/10 rounded  border-zoro-yellow/30"
                : status === "finished"
                  ? "text-zoro-grey font-semibold text-xs text-zoro-green  bg-zoro-card rounded  border-zoro-border"
                  : status === "upcoming"
                    ? "text-zoro-grey font-semibold text-xs text-zoro-yellow bg-zoro-card rounded  border-zoro-border"
                    : "bg-zoro-card text-zoro-grey border border-zoro-border"
            }
          `}
        >
          {status === "finished"
            ? "FT"
            : status === "live"
              ? "LIVE"
              : status === "halftime"
                ? "HT"
                : "UPCOMING"}
        </span>
      </div>

      {/* Teams & Scores – same structure as MatchCard */}
      <div>
        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {event.T1[0].Img ? (
              <div className="relative w-4 h-4 flex-shrink-0 bg-white/5 rounded-full p-1">
                <Image
                  src={getTeamLogoUrl(event.T1[0].Img) || ""}
                  alt={event.T1[0].Nm}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-4 h-4 flex-shrink-0 bg-zoro-border rounded-full flex items-center justify-center text-xs">
                ⚽
              </div>
            )}
            <span
              className={`
                truncate text-sm
                ${isLive ? "font-bold text-zoro-white" : "font-medium text-zoro-grey"}
              `}
            >
              {event.T1[0].Nm}
            </span>
          </div>
          <span
            className={`
              text-sm font-bold ml-3 w-10 text-right 
              ${isLive ? "text-zoro-white" : "text-zoro-grey"}
            `}
          >
            {isUpcoming ? "-" : event.Tr1}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {event.T2[0].Img ? (
              <div className="relative w-4 h-4 flex-shrink-0 bg-white/5 rounded-full p-1">
                <Image
                  src={getTeamLogoUrl(event.T2[0].Img) || ""}
                  alt={event.T2[0].Nm}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-4 h-4 flex-shrink-0 bg-zoro-border rounded-full flex items-center justify-center text-xs">
                ⚽
              </div>
            )}
            <span
              className={`
                truncate text-sm
                ${isLive ? "font-bold text-zoro-white" : "font-medium text-zoro-grey"}
              `}
            >
              {event.T2[0].Nm}
            </span>
          </div>
          <span
            className={`
              text-sm font-bold ml-3 w-10 text-right
              ${isLive ? "text-zoro-white" : "text-zoro-grey"}
            `}
          >
            {isUpcoming ? "-" : event.Tr2}
          </span>
        </div>
      </div>

      {/* Optional FT line like MatchCard shows HT – here we just show FT again */}
      {isFinished && (
        <div className="mt-2 pt-1 border-t border-zoro-border">
          <span className="text-xs text-zoro-grey">FT</span>
        </div>
      )}

      {/* Optional live bar */}
      {isLive && (
        <div className="mt-2 pt-1 border-t border-zoro-border">
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1 bg-zoro-border rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-zoro-green to-zoro-yellow w-3/4 animate-pulse" />
            </div>
            <span className="text-xs text-zoro-green font-semibold">LIVE</span>
          </div>
        </div>
      )}
    </div>
  );
}
