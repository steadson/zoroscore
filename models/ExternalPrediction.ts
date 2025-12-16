import mongoose, { Schema, Model } from "mongoose";
import { ExternalPrediction } from "@/lib/types";

const ExternalPredictionSchema = new Schema<ExternalPrediction>(
  {
    match_id: { type: String, required: true, index: true },
    source: { type: String, required: true },
    prediction: {
      type: String,
      enum: ["home", "draw", "away"],
      required: true
    },
    odds: {
      home: Number,
      draw: Number,
      away: Number
    },
    confidence: { type: Number, min: 0, max: 1 },
    analysis: String,
    scrapedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true
  }
);

ExternalPredictionSchema.index({ match_id: 1, source: 1 }, { unique: true });
ExternalPredictionSchema.index({ scrapedAt: -1 });

const ExternalPredictionModel: Model<ExternalPrediction> =
  mongoose.models.ExternalPrediction ||
  mongoose.model<ExternalPrediction>(
    "ExternalPrediction",
    ExternalPredictionSchema
  );

export default ExternalPredictionModel;
