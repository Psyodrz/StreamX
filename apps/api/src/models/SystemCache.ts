import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemCache extends Document {
  key: string;
  data: any;
  expiresAt?: Date;
}

const SystemCacheSchema: Schema = new Schema({
  key: { type: String, required: true, unique: true, index: true },
  data: { type: Schema.Types.Mixed, required: true },
  expiresAt: { type: Date },
}, { timestamps: true });

export default mongoose.model<ISystemCache>('SystemCache', SystemCacheSchema);
