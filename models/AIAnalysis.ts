import mongoose, { Schema, Model } from "mongoose";
import { AIAnalysis } from "@/lib/types";

const PredictionInsightSchema = new Schema({
  outcome: { type: String, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  reasoning: { type: String, required: true }
});

const AIAnalysisSchema = new Schema<AIAnalysis>(
  {
    match_id: { type: String, required: true, index: true },
    checkpoint: {
      type: String,
      enum: ["15min", "30min", "halftime", "60min", "75min", "fulltime"],
      required: true
    },
    summary: { type: String, required: true },
    keyInsights: [{ type: String }],
    predictions: {
      nextGoal: PredictionInsightSchema,
      finalScore: PredictionInsightSchema,
      totalGoals: PredictionInsightSchema,
      winner: PredictionInsightSchema
    },
    momentum: {
      team: {
        type: String,
        enum: ["home", "away", "balanced"],
        required: true
      },
      description: { type: String, required: true }
    },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    createdAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

AIAnalysisSchema.index({ match_id: 1, checkpoint: 1 }, { unique: true });
AIAnalysisSchema.index({ createdAt: -1 });

const AIAnalysisModel: Model<AIAnalysis> =
  mongoose.models.AIAnalysis ||
  mongoose.model<AIAnalysis>("AIAnalysis", AIAnalysisSchema);

export default AIAnalysisModel;
