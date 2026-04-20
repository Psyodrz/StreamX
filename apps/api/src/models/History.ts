import mongoose, { Schema, Document } from 'mongoose';

export interface IHistory extends Document {
  userId: mongoose.Types.ObjectId;
  songId: mongoose.Types.ObjectId;
  playedAt: Date;
  completionRate: number;
  sourceType: 'internal' | 'youtube';
}

const HistorySchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  songId: { type: Schema.Types.ObjectId, ref: 'Song', required: true },
  playedAt: { type: Date, default: Date.now, index: -1 },
  completionRate: { type: Number, min: 0, max: 1 },
  sourceType: { type: String, enum: ['internal', 'youtube'], required: true },
}, { timestamps: true });

// Compound index for user history retrieval
HistorySchema.index({ userId: 1, playedAt: -1 });

export default mongoose.model<IHistory>('History', HistorySchema);
