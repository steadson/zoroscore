import mongoose, { Schema, Model } from 'mongoose'
import { Consensus } from '@/lib/types'

const VoteBreakdownSchema = new Schema({
  homeWin: { type: Number, required: true, default: 0 },
  draw: { type: Number, required: true, default: 0 },
  awayWin: { type: Number, required: true, default: 0 },
})

const ConsensusSchema = new Schema<Consensus>(
  {
    match_id: { type: String, required: true, unique: true, index: true },
    predictedWinner: {
      type: String,
      enum: ['home', 'draw', 'away'],
      required: true,
    },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    reasoning: { type: String, required: true },
    voteBreakdown: { type: VoteBreakdownSchema, required: true },
    sources: [{ type: String }],
    generatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
)

ConsensusSchema.index({ generatedAt: -1 })

const ConsensusModel: Model<Consensus> =
  mongoose.models.Consensus || mongoose.model<Consensus>('Consensus', ConsensusSchema)

export default ConsensusModel
