"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface HeaderProps {
  starredCount?: number;
}

export default function Header({ starredCount = 0 }: HeaderProps) {
  const pathname = usePathname();

  // Determine which tab is active
  const isScoresActive = pathname === "/";
  const isPredictionsActive = pathname === "/predictions";
  const isStarredActive = pathname === "/starred";

  return (
    <header className="bg-zoro-card border-b border-zoro-border sticky top-0 z-50 backdrop-blur-sm bg-zoro-card/95">
      <div className="container mx-auto px-2 py-1">
        {/* Top Row */}
        <div className="flex items-center justify-between mb-2">
          <Link href="/" className=" font-bold flex items-center ">
            <span className="text-zoro-yellow text-2xl">ZORO</span>
            <span className="text-zoro-white text-2xl">SCORE</span>
          </Link>
          <div className="flex items-center gap-2">
            <button className="p-2.5 hover:bg-zoro-border rounded-lg transition-colors text-zoro-grey hover:text-zoro-yellow">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </button>
            <button className="p-2.5 hover:bg-zoro-border rounded-lg transition-colors text-zoro-grey hover:text-zoro-yellow">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-6 text-sm">
          <Link
            href="/"
            className={`pb-2 border-b-2 font-bold transition-colors ${isScoresActive
              ? "border-zoro-yellow text-zoro-yellow"
              : "border-transparent text-zoro-grey hover:text-zoro-white hover:border-zoro-grey"}`}
          >
            SCORES
          </Link>
          <Link
            href="/predictions"
            className={`pb-2 border-b-2 font-semibold transition-colors ${isPredictionsActive
              ? "border-zoro-yellow text-zoro-yellow"
              : "border-transparent text-zoro-grey hover:text-zoro-white hover:border-zoro-grey"}`}
          >
            PREDICTIONS
          </Link>
          <Link
            href="/starred"
            className={`pb-2 border-b-2 font-semibold transition-colors flex items-center gap-2 ${isStarredActive
              ? "border-zoro-yellow text-zoro-yellow"
              : "border-transparent text-zoro-grey hover:text-zoro-white hover:border-zoro-grey"}`}
          >
            STARRED
            {starredCount > 0 &&
              <span className="bg-zoro-yellow text-zoro-dark text-xs font-bold px-2 py-0.5 rounded-full">
                {starredCount}
              </span>}
          </Link>
        </div>
      </div>
    </header>
  );
}
