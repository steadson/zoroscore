import mongoose, { Schema, Model } from "mongoose";
import { Match } from "@/lib/types";

const TeamSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  logo: String,
  shortName: String
});

const ScoreSchema = new Schema({
  home: { type: Number, required: true, default: 0 },
  away: { type: Number, required: true, default: 0 },
  halfTime: {
    home: Number,
    away: Number
  }
});

const MatchEventSchema = new Schema({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ["goal", "yellow_card", "red_card", "substitution", "penalty", "var"],
    required: true
  },
  minute: { type: Number, required: true },
  team: { type: String, enum: ["home", "away"], required: true },
  player: String,
  description: String
});

const MatchStatsSchema = new Schema({
  possession: [Number],
  shots: [Number],
  shotsOnTarget: [Number],
  corners: [Number],
  fouls: [Number],
  offsides: [Number],
  yellowCards: [Number],
  redCards: [Number]
});

const MatchSchema = new Schema<Match>(
  {
    match_id: { type: String, required: true, unique: true, index: true },
    homeTeam: { type: TeamSchema, required: true },
    awayTeam: { type: TeamSchema, required: true },
    score: { type: ScoreSchema, required: true },
    status: {
      type: String,
      enum: [
        "upcoming",
        "live",
        "halftime",
        "finished",
        "postponed",
        "cancelled"
      ],
      required: true,
      index: true
    },
    startTime: { type: Date, required: true, index: true },
    league: {
      id: { type: String }, // ← Make optional
      name: { type: String, required: true },
      country: { type: String, required: true },
      logo: String,
      ccd: String, // ← ADD THIS
      scd: String, // ← ADD THIS
      compId: String // ← ADD THIS
    },
    events: [MatchEventSchema],
    stats: MatchStatsSchema,
    minute: Number,
    addedTime: Number,
    venue: String,
    referee: String,
    lastUpdated: { type: Date, default: Date.now },
    ttl: { type: Date, index: true }
  },
  {
    timestamps: true
  }
);

MatchSchema.index({ ttl: 1 }, { expireAfterSeconds: 0 });
MatchSchema.index({ status: 1, startTime: -1 });

const MatchModel: Model<Match> =
  mongoose.models.Match || mongoose.model<Match>("Match", MatchSchema);

export default MatchModel;
