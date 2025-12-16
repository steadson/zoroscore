"use client";

import { useState, useMemo } from "react";
import { useMatches } from "./hooks/useMatches";
import Header from "./components/Header";
import { useStarredMatches } from "./hooks/useStarredMatches";
import FilterTabs from "./components/FilterTabs";
import SortBy from "./components/SortBy";
import TimeOrderDropdown from "./components/TimeOrderDropdown";
import LeagueSection from "./components/LeagueSection";
import StatusSection from "./components/StatusSection";
import MatchCardWithLeagueHeader from "./components/MatchCardWithLeagueHeader";
import LoadingSpinner from "./components/LoadingSpinner";
import EmptyState from "./components/EmptyState";
import Image from "next/image";
import { Match } from "@/lib/types";

export default function HomePage() {
  const [activeFilter, setActiveFilter] = useState<"all" | "live" | "finished">(
    "all"
  );
  const [selectedLeague, setSelectedLeague] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"time" | "league" | "status">("league");
  const [timeOrder, setTimeOrder] = useState<"asc" | "desc">("asc");

  // Initialize with today's date at midnight
  const getTodayAtMidnight = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  };

  const [selectedDate, setSelectedDate] = useState<Date | null>(
    getTodayAtMidnight()
  );

  const { matches, loading, error } = useMatches(30000);
  const { toggleStar, isStarred, getStarredCount } = useStarredMatches();

  // Filter matches by date first
  const matchesForDate = useMemo(
    () => {
      if (!selectedDate) return matches;

      const filterDate = new Date(selectedDate);
      filterDate.setHours(0, 0, 0, 0);

      return matches.filter(match => {
        const matchDate = new Date(match.startTime);
        matchDate.setHours(0, 0, 0, 0);
        return matchDate.getTime() === filterDate.getTime();
      });
    },
    [matches, selectedDate]
  );

  // Then filter by status
  const filteredMatches = useMemo(
    () => {
      if (activeFilter === "all") return matchesForDate;
      if (activeFilter === "live") {
        return matchesForDate.filter(
          m => m.status === "live" || m.status === "halftime"
        );
      }
      if (activeFilter === "finished") {
        return matchesForDate.filter(m => m.status === "finished");
      }
      return matchesForDate;
    },
    [matchesForDate, activeFilter]
  );

  // Sort and group matches based on sortBy
  const displayContent = useMemo(() => {
    if (sortBy === "time") {
      // TIME: Flat list sorted by exact time (ASC or DESC)
      const sorted = [...filteredMatches].sort((a, b) => {
        const timeA = new Date(a.startTime).getTime();
        const timeB = new Date(b.startTime).getTime();
        return timeOrder === "asc" ? timeA - timeB : timeB - timeA;
      });
      
      return { type: "time" as const, matches: sorted };
    } 
    
    else if (sortBy === "status") {
      // STATUS: Group by status with collapsible sections and league headers
      const statusOrder = { live: 0, halftime: 1, upcoming: 2, finished: 3, postponed: 4, cancelled: 5 };
      const sorted = [...filteredMatches].sort((a, b) => {
        const statusDiff = statusOrder[a.status] - statusOrder[b.status];
        if (statusDiff !== 0) return statusDiff;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });

      const statusOrderArray: string[] = [];
      const grouped: Record<string, { name: string; icon: string; matches: Match[] }> = {};
      
      sorted.forEach(match => {
        const statusKey = match.status.toUpperCase();
        if (!grouped[statusKey]) {
          statusOrderArray.push(statusKey);
          grouped[statusKey] = {
            name: statusKey === "LIVE" ? "LIVE" : 
                  statusKey === "HALFTIME" ? "HALFTIME" :
                  statusKey === "UPCOMING" ? "UPCOMING" :
                  statusKey === "FINISHED" ? "FINISHED" : statusKey,
            icon: statusKey === "LIVE" ? "🔴" : 
                  statusKey === "HALFTIME" ? "⏸️" :
                  statusKey === "UPCOMING" ? "🕐" :
                  statusKey === "FINISHED" ? "✅" : "⚽",
            matches: []
          };
        }
        grouped[statusKey].matches.push(match);
      });

      return { 
        type: "status" as const, 
        groups: grouped,
        statusOrder: statusOrderArray
      };
    } 
    
    else {
      // LEAGUE: Group by league - PRESERVE API ORDER
      const leagueOrder: string[] = [];
      const groups: Record<
  string,
  {
    name: string;
    country: string;
    logo?: string;
    matches: Match[];
    ccd?: string;    // ← ADD THIS
    scd?: string;    // ← ADD THIS
  }
> = {};

      filteredMatches.forEach(match => {
  const leagueId = match.league.id;
  
  if (!groups[leagueId]) {
    leagueOrder.push(leagueId);
    groups[leagueId] = {
      name: match.league.name,
      country: match.league.country,
      logo: match.league.logo,
      ccd: match.league.ccd,   // ← ADD THIS
      scd: match.league.scd,   // ← ADD THIS
      matches: []
    };
  }
  groups[leagueId].matches.push(match);
});

      // Sort matches within each league by time
      Object.values(groups).forEach(group => {
        group.matches.sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
      });

      return { 
        type: "league" as const, 
        groups,
        leagueOrder
      };
    }
  }, [filteredMatches, sortBy, timeOrder]);

  // For desktop league filter
  const groupedMatches = useMemo(() => {
    if (displayContent.type === "league") {
      return displayContent.groups;
    }
    return {};
  }, [displayContent]);

  const displayedMatches = useMemo(() => {
    if (!selectedLeague || displayContent.type !== "league") {
      return groupedMatches;
    }
    
    const filtered: typeof groupedMatches = {};
    if (groupedMatches[selectedLeague]) {
      filtered[selectedLeague] = groupedMatches[selectedLeague];
    }
    return filtered;
  }, [groupedMatches, selectedLeague, displayContent]);

  // Calculate counts based on date-filtered matches
  const counts = useMemo(
    () => ({
      all: matchesForDate.length,
      live: matchesForDate.filter(
        m => m.status === "live" || m.status === "halftime"
      ).length,
      finished: matchesForDate.filter(m => m.status === "finished").length
    }),
    [matchesForDate]
  );

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      setSelectedDate(normalized);
    } else {
      setSelectedDate(getTodayAtMidnight());
    }
  };

  // Render matches based on sort type
  const renderMatches = () => {
    if (sortBy === "time" && displayContent.type === "time") {
      // TIME VIEW: Flat list with league headers
      return (
        <div className="space-y-2">
          {displayContent.matches.map((match, index) => {
            // Show league header if:
            // 1. First match, OR
            // 2. Different league from previous match
            const showLeagueHeader = 
              index === 0 || 
              match.league.id !== displayContent.matches[index - 1].league.id;

            return (
              <MatchCardWithLeagueHeader
                key={match.match_id}
                match={match}
                showLeagueHeader={showLeagueHeader}
                isStarred={isStarred(match.match_id)}
                onToggleStar={toggleStar}
              />
            );
          })}
        </div>
      );
    } 
    
    else if (sortBy === "status" && displayContent.type === "status") {
      // STATUS VIEW: Grouped by status with collapsible sections and league headers
      return (
        <div>
          {displayContent.statusOrder.map(statusKey => {
            const group = displayContent.groups[statusKey];
            return (
              <StatusSection
                key={statusKey}
                statusName={group.name}
                statusIcon={group.icon}
                matches={group.matches}
                isStarred={isStarred}
                onToggleStar={toggleStar}
              />
            );
          })}
        </div>
      );
    } 
    
    else if (sortBy === "league" && displayContent.type === "league") {
      // LEAGUE VIEW: Grouped by league in API order
      const matchesToDisplay = selectedLeague ? displayedMatches : groupedMatches;
      const orderToUse = displayContent.leagueOrder || Object.keys(matchesToDisplay);
      
      return (
        <div>
          {orderToUse
            .filter(leagueId => matchesToDisplay[leagueId])
            .map(leagueId => {
              const group = matchesToDisplay[leagueId];
              return (
                <LeagueSection
  key={leagueId}
  leagueId={leagueId || group.ccd || "details"} 
  leagueName={group.name}
  leagueCountry={group.country}
  leagueLogo={group.logo}
  ccd={group.ccd}              // ← ADD THIS
  scd={group.scd}              // ← ADD THIS
  matches={group.matches}
  isStarred={isStarred}
  onToggleStar={toggleStar}
/>
              );
            })}
        </div>
      );
    }
  };

  return <div className="min-h-screen bg-zoro-dark">
      <Header starredCount={getStarredCount()} />

      {/* Mobile Layout - Full Width */}
      <main className="lg:hidden container mx-auto px-2 py-2">
        {/* Filters */}
        <div className="mb-6">
          <FilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} onDateChange={handleDateChange} selectedDate={selectedDate} counts={counts} />
        </div>

        {/* Sort By and Time Order */}
        <div className="flex items-center align-bottom gap-3 mb-2">
          <SortBy sortBy={sortBy} onSortChange={setSortBy} />
          {sortBy === "time" && (
            <TimeOrderDropdown timeOrder={timeOrder} onTimeOrderChange={setTimeOrder} />
          )}
        </div>

        {/* Date indicator */}
        {selectedDate && <div className="mb-4 text-center">
            <p className="text-zoro-grey text-sm">
              Showing matches for <span className="text-zoro-yellow font-semibold">
                {selectedDate.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </span>
            </p>
          </div>}

        {/* Loading */}
        {loading && <LoadingSpinner />}

        {/* Error */}
        {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
            ⚠️ {error}
          </div>}

        {/* Empty */}
        {!loading && !error && filteredMatches.length === 0 && <EmptyState message={activeFilter === "live" ? "No live matches at the moment" : activeFilter === "finished" ? "No finished matches for this date" : "No matches scheduled for this date"} />}

        {/* Matches */}
        {!loading && !error && filteredMatches.length > 0 && renderMatches()}

        {/* Auto-refresh */}
        {!loading && matches.length > 0 && <div className="text-center text-xs text-zoro-grey mt-8 flex items-center justify-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zoro-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-zoro-green" />
            </span>
            Updates automatically every 30 seconds
          </div>}
      </main>

      {/* Desktop Layout - 4 Sections */}
      <main className="hidden lg:flex container mx-auto max-w-[1920px]">
        {/* Left Half (2/4) - Match Data Area */}
        <div className="w-1/2 flex mt-6">
          {/* League Sidebar (1/4 of screen) */}
          <aside className="w-1/2">
            <div className="p-2 w-3/4  h-max">
              <h2 className="text-zoro-white font-bold text-sm mb-4">
                Competitions for -
                {selectedDate && <span className="mb-4 text-center">
                    <span className="text-zoro-grey text-sm">
                      <span className="text-zoro-yellow font-semibold">
                        {selectedDate.toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric"
                        })}
                      </span>
                    </span>
                  </span>}
              </h2>

              {/* All Leagues Option */}
              <button onClick={() => setSelectedLeague(null)} className={`
                  w-full text-left p-3 rounded-lg mb-2 transition-all
                  ${!selectedLeague ? "bg-zoro-yellow text-zoro-dark font-bold" : "bg-zoro-card text-zoro-grey hover:bg-zoro-card/80 hover:text-zoro-white"}
                `}>
                <div className="flex items-center justify-between">
                  <span className="text-sm">All Competitions</span>
                  <span className="text-xs">
                    {Object.keys(groupedMatches).length}
                  </span>
                </div>
              </button>

              {/* League List - Preserve API order */}
              <div className="space-y-1">
                {displayContent.type === "league" && displayContent.leagueOrder
                  ? displayContent.leagueOrder.map(leagueId => {
                      const group = groupedMatches[leagueId];
                      if (!group) return null;
                      return (
                        <button
                          key={leagueId}
                          onClick={() => setSelectedLeague(leagueId)}
                          className={`
                            w-full text-left p-2 rounded-lg transition-all
                            ${selectedLeague === leagueId
                              ? "bg-zoro-yellow text-zoro-dark font-bold"
                              : "bg-zoro-card text-zoro-grey hover:bg-zoro-card/80 hover:text-zoro-white"}
                          `}
                        >
                          <div className="flex items-center gap-2">
                            {group.logo &&
                              <div className="relative w-3 h-3 flex-shrink-0">
                                <Image
                                  src={group.logo}
                                  alt={group.name}
                                  fill
                                  className="object-contain"
                                  unoptimized
                                />
                              </div>}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold truncate text-sm">
                                {group.name}
                              </div>
                              <div className="text-xs opacity-70">
                                {group.country}
                              </div>
                            </div>
                            <span className="text-xs font-bold">
                              {group.matches.length}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  : Object.entries(groupedMatches).map(([leagueId, group]) =>
                      <button
                        key={leagueId}
                        onClick={() => setSelectedLeague(leagueId)}
                        className={`
                          w-full text-left p-2 rounded-lg transition-all
                          ${selectedLeague === leagueId
                            ? "bg-zoro-yellow text-zoro-dark font-bold"
                            : "bg-zoro-card text-zoro-grey hover:bg-zoro-card/80 hover:text-zoro-white"}
                        `}
                      >
                        <div className="flex items-center gap-2">
                          {group.logo &&
                            <div className="relative w-3 h-3 flex-shrink-0">
                              <Image
                                src={group.logo}
                                alt={group.name}
                                fill
                                className="object-contain"
                                unoptimized
                              />
                            </div>}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate text-sm">
                              {group.name}
                            </div>
                            <div className="text-xs opacity-70">
                              {group.country}
                            </div>
                          </div>
                          <span className="text-xs font-bold">
                            {group.matches.length}
                          </span>
                        </div>
                      </button>
                    )}
              </div>
            </div>
          </aside>

          {/* Match Display Area (1/4 of screen) */}
          <div className="w-1/2 ml-5 border h-max">
            <div className="p-4">
              {/* Filters */}
              <div className="mb-6">
                <FilterTabs activeFilter={activeFilter} onFilterChange={setActiveFilter} onDateChange={handleDateChange} selectedDate={selectedDate} counts={counts} />
              </div>

              {/* Sort By and Time Order */}
              <div className="flex items-center gap-3 mb-4">
                <SortBy sortBy={sortBy} onSortChange={setSortBy} />
                {sortBy === "time" && (
                  <TimeOrderDropdown timeOrder={timeOrder} onTimeOrderChange={setTimeOrder} />
                )}
              </div>

              {/* Date indicator */}
              {selectedDate && <div className="mb-4 text-center">
                  <p className="text-zoro-grey text-sm">
                    Showing matches for <span className="text-zoro-yellow font-semibold">
                      {selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </span>
                  </p>
                </div>}

              {/* Loading */}
              {loading && <LoadingSpinner />}

              {/* Error */}
              {error && <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400">
                  ⚠️ {error}
                </div>}

              {/* Empty */}
              {!loading && !error && filteredMatches.length === 0 && <EmptyState message={activeFilter === "live" ? "No live matches at the moment" : activeFilter === "finished" ? "No finished matches for this date" : "No matches scheduled for this date"} />}

              {/* Matches */}
              {!loading && !error && filteredMatches.length > 0 && renderMatches()}

              {/* Auto-refresh */}
              {!loading && matches.length > 0 && <div className="text-center text-xs text-zoro-grey mt-8 flex items-center justify-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-zoro-green opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-zoro-green" />
                  </span>
                  Updates automatically every 30 seconds
                </div>}
            </div>
          </div>
        </div>

        {/* Right Half (2/4) - Ad Space */}
        <div className="w-1/2  bg-zoro-card/30">
          <div className="h-screen flex items-center justify-center">
            <div className="text-center text-zoro-grey" />
          </div>
        </div>
      </main>
    </div>;
}