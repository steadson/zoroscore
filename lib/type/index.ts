// ========================================
// MATCH TYPES
// ========================================

export interface Team {
  id: string;
  name: string;
  logo?: string;
  shortName?: string;
}

export interface Score {
  home: number;
  away: number;
  halfTime?: {
    home: number;
    away: number;
  };
}

export interface MatchEvent {
  id: string;
  type:
    | "goal"
    | "yellow_card"
    | "red_card"
    | "substitution"
    | "penalty"
    | "var";
  minute: number;
  team: "home" | "away";
  player?: string;
  description?: string;
}

export interface MatchStats {
  possession?: [number, number];
  shots?: [number, number];
  shotsOnTarget?: [number, number];
  corners?: [number, number];
  fouls?: [number, number];
  offsides?: [number, number];
  yellowCards?: [number, number];
  redCards?: [number, number];
}

export type MatchStatus =
  | "upcoming"
  | "live"
  | "halftime"
  | "finished"
  | "postponed"
  | "cancelled";

export interface Match {
  _id?: string;
  match_id: string;
  homeTeam: Team;
  awayTeam: Team;
  score: Score;
  status: MatchStatus;
  startTime: Date;
  league: {
    id: string;
    name: string;
    country: string;
    logo?: string;
    ccd?: string; // ← ADD THIS: Country code (e.g., "serbia")
    scd?: string; // ← ADD THIS: Stage code (e.g., "serbian-cup")
    compId?: string; // ← ADD THIS: Competition ID (optional)
  };
  events: MatchEvent[];
  stats?: MatchStats;
  minute?: number;
  addedTime?: number;
  venue?: string;
  referee?: string;
  lastUpdated: Date;
  ttl?: Date;
}

// ========================================
// AI ANALYSIS TYPES
// ========================================

export interface PredictionInsight {
  outcome: string;
  confidence: number;
  reasoning: string;
}

export interface AIAnalysis {
  _id?: string;
  match_id: string;
  checkpoint: "15min" | "30min" | "halftime" | "60min" | "75min" | "fulltime";
  summary: string;
  keyInsights: string[];
  predictions: {
    nextGoal?: PredictionInsight;
    finalScore?: PredictionInsight;
    totalGoals?: PredictionInsight;
    winner?: PredictionInsight;
  };
  momentum: {
    team: "home" | "away" | "balanced";
    description: string;
  };
  confidence: number;
  createdAt: Date;
}

// ========================================
// PREDICTION TYPES
// ========================================

export interface ExternalPrediction {
  _id?: string;
  match_id: string;
  source: string;
  prediction: "home" | "draw" | "away";
  odds?: {
    home: number;
    draw: number;
    away: number;
  };
  confidence?: number;
  analysis?: string;
  scrapedAt: Date;
}

// ========================================
// CONSENSUS TYPES
// ========================================

export interface VoteBreakdown {
  homeWin: number;
  draw: number;
  awayWin: number;
}

export interface Consensus {
  _id?: string;
  match_id: string;
  predictedWinner: "home" | "draw" | "away";
  confidence: number;
  reasoning: string;
  voteBreakdown: VoteBreakdown;
  sources: string[];
  generatedAt: Date;
}

// ========================================
// API RESPONSE TYPES
// ========================================

export interface MatchWithAnalysis extends Match {
  aiAnalysis?: AIAnalysis[];
  predictions?: ExternalPrediction[];
  consensus?: Consensus;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ========================================
// LIVESCORE API TYPES
// ========================================

export interface LiveScoreApiMatch {
  Stages?: Array<{
    Sid?: string;
    Snm?: string;
    Ccd?: string;
    Cnm?: string;
    Events?: Array<{
      Eid?: string;
      Esd?: number;
      Eps?: string;
      T1?: Array<{
        ID?: string;
        Nm?: string;
        Img?: string;
      }>;
      T2?: Array<{
        ID?: string;
        Nm?: string;
        Img?: string;
      }>;
      Tr1?: string;
      Tr2?: string;
      Tr1h?: string;
      Tr2h?: string;
      Epr?: string;
      Ecov?: number;
    }>;
  }>;
}

// ========================================
// CRON JOB TYPES
// ========================================

export interface CronJobResult {
  success: boolean;
  jobName: string;
  executedAt: Date;
  matchesProcessed?: number;
  errors?: string[];
  details?: any;
}
