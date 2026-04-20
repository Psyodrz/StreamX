import mongoose, { Schema, Document } from 'mongoose';

export interface ISong extends Document {
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  duration: number;
  language: string;
  genre: string[];
  internalAudioUrl?: string;
  youtubeVideoId?: string;
  playCount: number;
  releaseDate?: Date;
  isPublished: boolean;
}

const SongSchema: Schema = new Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  album: { type: String },
  albumArt: { type: String },
  duration: { type: Number, required: true },
  language: { type: String, required: true, index: true },
  genre: { type: [String], index: true },
  internalAudioUrl: { type: String },
  youtubeVideoId: { type: String },
  playCount: { type: Number, default: 0, index: -1 },
  releaseDate: { type: Date },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true });

// Compound indexes for common queries
SongSchema.index({ language: 1, genre: 1 });
SongSchema.index({ title: 'text', artist: 'text' });

export default mongoose.model<ISong>('Song', SongSchema);
