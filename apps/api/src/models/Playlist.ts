import mongoose, { Schema, Document } from 'mongoose';

export interface IPlaylist extends Document {
  ownerId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  coverImage?: string;
  songs: mongoose.Types.ObjectId[];
  isPublic: boolean;
  shareToken?: string;
}

const PlaylistSchema: Schema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  coverImage: { type: String },
  songs: [{ type: Schema.Types.ObjectId, ref: 'Song' }],
  isPublic: { type: Boolean, default: false },
  shareToken: { type: String, unique: true, sparse: true },
}, { timestamps: true });

export default mongoose.model<IPlaylist>('Playlist', PlaylistSchema);
