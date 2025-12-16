"use client";

import { useState } from "react";

import Image from "next/image";
import {
  LeagueStats,
  TeamStanding,
  TeamForm
} from "@/lib/services/comprehensive_league_service.service";
// import { Match } from "@/types/Match";

// ============================================================================
// STANDINGS TAB COMPONENT
// ============================================================================
interface StandingsTabProps {
  overall: TeamStanding[];
  home: TeamStanding[];
  away: TeamStanding[];
  form: TeamForm[];
}

export function StandingsTab({ overall, home, away, form }: StandingsTabProps) {
  const [activeTable, setActiveTable] = useState<
    "overall" | "home" | "away" | "form"
  >("overall");

  const getCurrentTable = () => {
    switch (activeTable) {
      case "overall":
        return <OverallStandingsTable teams={overall} />;
      case "home":
        return <HomeAwayStandingsTable teams={home} title="Home" />;
      case "away":
        return <HomeAwayStandingsTable teams={away} title="Away" />;
      case "form":
        return <FormTable teams={form} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Table Type Selector */}
      <div className="flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTable("overall")}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${activeTable ===
          "overall"
            ? "bg-[#FFC400] text-[#030c24] font-semibold"
            : "bg-white/5 text-white hover:bg-white/10"}`}
        >
          Overall
        </button>
        <button
          onClick={() => setActiveTable("home")}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${activeTable ===
          "home"
            ? "bg-[#FFC400] text-[#030c24] font-semibold"
            : "bg-white/5 text-white hover:bg-white/10"}`}
        >
          Home
        </button>
        <button
          onClick={() => setActiveTable("away")}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${activeTable ===
          "away"
            ? "bg-[#FFC400] text-[#030c24] font-semibold"
            : "bg-white/5 text-white hover:bg-white/10"}`}
        >
          Away
        </button>
        <button
          onClick={() => setActiveTable("form")}
          className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${activeTable ===
          "form"
            ? "bg-[#FFC400] text-[#030c24] font-semibold"
            : "bg-white/5 text-white hover:bg-white/10"}`}
        >
          Form (Last 5)
        </button>
      </div>

      {/* Current Table */}
      {getCurrentTable()}
    </div>
  );
}

// Overall Standings Table
function OverallStandingsTable({ teams }: { teams: TeamStanding[] }) {
  return (
    <div className="bg-white/5 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr className="text-xs text-gray-400">
              <th className="text-left p-3 font-medium">#</th>
              <th className="text-left p-3 font-medium">Team</th>
              <th className="text-center p-3 font-medium">P</th>
              <th className="text-center p-3 font-medium">W</th>
              <th className="text-center p-3 font-medium">D</th>
              <th className="text-center p-3 font-medium">L</th>
              <th className="text-center p-3 font-medium">GF</th>
              <th className="text-center p-3 font-medium">GA</th>
              <th className="text-center p-3 font-medium">GD</th>
              <th className="text-center p-3 font-medium font-semibold">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {teams.map((team, index) =>
              <tr
                key={team.teamId}
                className={`hover:bg-white/5 transition-colors ${getPromotionZoneClass(
                  team.rank,
                  team.promotionZone
                )}`}
              >
                <td className="p-3">
                  <span
                    className={`text-sm font-medium ${getPromotionZoneTextClass(
                      team.rank,
                      team.promotionZone
                    )}`}
                  >
                    {team.rank}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="relative w-6 h-6 flex-shrink-0">
                      <Image
                        src={getTeamLogoUrl(team.teamLogo)}
                        alt={team.teamName}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-sm text-white font-medium">
                      {team.teamName}
                    </span>
                  </div>
                </td>
                <td className="text-center p-3 text-sm text-gray-300">
                  {team.played}
                </td>
                <td className="text-center p-3 text-sm text-gray-300">
                  {team.won}
                </td>
                <td className="text-center p-3 text-sm text-gray-300">
                  {team.drawn}
                </td>
                <td className="text-center p-3 text-sm text-gray-300">
                  {team.lost}
                </td>
                <td className="text-center p-3 text-sm text-gray-300">
                  {team.goalsFor}
                </td>
                <td className="text-center p-3 text-sm text-gray-300">
                  {team.goalsAgainst}
                </td>
                <td className="text-center p-3">
                  <span
                    className={`text-sm font-medium ${team.goalDifference > 0
                      ? "text-[#1ED760]"
                      : team.goalDifference < 0
                        ? "text-red-400"
                        : "text-gray-400"}`}
                  >
                    {team.goalDifference > 0 ? "+" : ""}
                    {team.goalDifference}
                  </span>
                </td>
                <td className="text-center p-3">
                  <span className="text-sm font-bold text-white">
                    {team.points}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Home/Away Standings Table
function HomeAwayStandingsTable({
  teams,
  title
}: {
  teams: TeamStanding[];
  title: string;
}) {
  return (
    <div className="bg-white/5 rounded-lg overflow-hidden">
      <div className="p-3 bg-white/5 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white">
          {title} Form
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr className="text-xs text-gray-400">
              <th className="text-left p-3 font-medium">#</th>
              <th className="text-left p-3 font-medium">Team</th>
              <th className="text-center p-3 font-medium">P</th>
              <th className="text-center p-3 font-medium">W</th>
              <th className="text-center p-3 font-medium">D</th>
              <th className="text-center p-3 font-medium">L</th>
              <th className="text-center p-3 font-medium">GD</th>
              <th className="text-center p-3 font-medium font-semibold">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {teams.map(team =>
              <tr
                key={team.teamId}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="p-3 text-sm text-white font-medium">
                  {team.rank}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="relative w-6 h-6 flex-shrink-0">
                      <Image
                        src={getTeamLogoUrl(team.teamLogo)}
                        alt={team.teamName}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-sm text-white font-medium">
                      {team.teamName}
                    </span>
                  </div>
                </td>
                <td className="text-center p-3 text-sm text-gray-300">
                  {team.played}
                </td>
                <td className="text-center p-3 text-sm text-gray-300">
                  {team.won}
                </td>
                <td className="text-center p-3 text-sm text-gray-300">
                  {team.drawn}
                </td>
                <td className="text-center p-3 text-sm text-gray-300">
                  {team.lost}
                </td>
                <td className="text-center p-3">
                  <span
                    className={`text-sm font-medium ${team.goalDifference > 0
                      ? "text-[#1ED760]"
                      : team.goalDifference < 0
                        ? "text-red-400"
                        : "text-gray-400"}`}
                  >
                    {team.goalDifference > 0 ? "+" : ""}
                    {team.goalDifference}
                  </span>
                </td>
                <td className="text-center p-3">
                  <span className="text-sm font-bold text-white">
                    {team.points}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Form Table (Last 5 matches)
function FormTable({ teams }: { teams: TeamForm[] }) {
  return (
    <div className="bg-white/5 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5 border-b border-white/10">
            <tr className="text-xs text-gray-400">
              <th className="text-left p-3 font-medium">#</th>
              <th className="text-left p-3 font-medium">Team</th>
              <th className="text-left p-3 font-medium">Last 5</th>
              <th className="text-center p-3 font-medium">GD</th>
              <th className="text-center p-3 font-medium font-semibold">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {teams.map(team =>
              <tr
                key={team.teamId}
                className="hover:bg-white/5 transition-colors"
              >
                <td className="p-3 text-sm text-white font-medium">
                  {team.rank}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="relative w-6 h-6 flex-shrink-0">
                      <Image
                        src={getTeamLogoUrl(team.teamLogo)}
                        alt={team.teamName}
                        fill
                        className="object-contain"
                      />
                    </div>
                    <span className="text-sm text-white font-medium">
                      {team.teamName}
                    </span>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {team.form.map((result, index) =>
                      <div
                        key={index}
                        className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${result.result ===
                        1
                          ? "bg-[#1ED760] text-[#030c24]"
                          : result.result === 0
                            ? "bg-gray-500 text-white"
                            : "bg-red-500 text-white"}`}
                      >
                        {result.result === 1
                          ? "W"
                          : result.result === 0 ? "D" : "L"}
                      </div>
                    )}
                  </div>
                </td>
                <td className="text-center p-3">
                  <span
                    className={`text-sm font-medium ${team.goalDifference > 0
                      ? "text-[#1ED760]"
                      : team.goalDifference < 0
                        ? "text-red-400"
                        : "text-gray-400"}`}
                  >
                    {team.goalDifference > 0 ? "+" : ""}
                    {team.goalDifference}
                  </span>
                </td>
                <td className="text-center p-3">
                  <span className="text-sm font-bold text-white">
                    {team.points}
                  </span>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// STATS TAB COMPONENT
// ============================================================================
interface StatsTabProps {
  stats: LeagueStats;
}

export function StatsTab({ stats }: StatsTabProps) {
  const [activeCategory, setActiveCategory] = useState<
    "topScorers" | "assists" | "yellowCards" | "redCards"
  >("topScorers");

  const categories = [
    { key: "topScorers", label: "Top Scorers", icon: "⚽" },
    { key: "assists", label: "Assists", icon: "🎯" },
    { key: "yellowCards", label: "Yellow Cards", icon: "🟨" },
    { key: "redCards", label: "Red Cards", icon: "🟥" }
  ];

  const getCurrentStats = () => {
    return stats[activeCategory] || [];
  };

  return (
    <div className="space-y-4">
      {/* Category Selector */}
      <div className="flex gap-2 overflow-x-auto">
        {categories.map(category =>
          <button
            key={category.key}
            onClick={() => setActiveCategory(category.key as any)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${activeCategory ===
            category.key
              ? "bg-[#FFC400] text-[#030c24] font-semibold"
              : "bg-white/5 text-white hover:bg-white/10"}`}
          >
            <span>
              {category.icon}
            </span>
            <span>
              {category.label}
            </span>
          </button>
        )}
      </div>

      {/* Stats List */}
      <div className="bg-white/5 rounded-lg overflow-hidden">
        <div className="divide-y divide-white/5">
          {getCurrentStats().length === 0
            ? <div className="p-8 text-center text-gray-400">
                No statistics available
              </div>
            : getCurrentStats().map((player, index) =>
                <div
                  key={player.playerId}
                  className="p-4 hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Rank */}
                    <div className="w-8 text-center">
                      <span
                        className={`text-lg font-bold ${index === 0
                          ? "text-[#FFC400]"
                          : "text-gray-400"}`}
                      >
                        {player.rank}
                      </span>
                    </div>

                    {/* Player Info */}
                    <div className="flex-1 flex items-center gap-3">
                      {player.imageUrl &&
                        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-white/5">
                          <Image
                            src={`https://lsm-static-prod.livescore.com/medium/${player.imageUrl}`}
                            alt={player.playerName}
                            fill
                            className="object-cover"
                          />
                        </div>}
                      <div className="flex-1">
                        <div className="text-white font-medium">
                          {player.playerName}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="relative w-4 h-4">
                            <Image
                              src={getTeamLogoUrl(player.teamLogo)}
                              alt={player.teamName}
                              fill
                              className="object-contain"
                            />
                          </div>
                          <span className="text-xs text-gray-400">
                            {player.teamName}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Value */}
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#FFC400]">
                        {player.value}
                      </div>
                    </div>
                  </div>
                </div>
              )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================
function getPromotionZoneClass(rank: number, promotionZone?: number[]) {
  if (!promotionZone || promotionZone.length === 0) return "";

  // Check if in promotion zone
  if (rank <= 4) return "border-l-4 border-[#1ED760]";
  if (rank >= 18) return "border-l-4 border-red-500";

  return "";
}

function getPromotionZoneTextClass(rank: number, promotionZone?: number[]) {
  if (!promotionZone || promotionZone.length === 0) return "text-white";

  if (rank <= 4) return "text-[#1ED760]";
  if (rank >= 18) return "text-red-400";

  return "text-white";
}

function getTeamLogoUrl(logo: string): string {
  if (!logo) return "/placeholder-team.png";

  if (logo.startsWith("http")) return logo;

  if (logo.includes("teambadge/")) {
    return `https://lsm-static-prod.livescore.com/medium/${logo}`;
  }

  return `https://lsm-static-prod.livescore.com/medium/${logo}`;
}
