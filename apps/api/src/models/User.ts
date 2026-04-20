import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  displayName: string;
  avatar?: string;
  languagePreferences: string[];
  genrePreferences: string[];
  isPremium: boolean;
  refreshTokenHash?: string;
  loginAttempts: number;
  lockedUntil?: Date;
  comparePassword: (password: string) => Promise<boolean>;
  isLocked: boolean;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  displayName: { type: String, required: true, maxlength: 50 },
  avatar: { type: String },
  languagePreferences: { type: [String], default: ['en'] },
  genrePreferences: { type: [String], default: [] },
  isPremium: { type: Boolean, default: false },
  refreshTokenHash: { type: String },
  loginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date },
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash as string, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.passwordHash);
};

// Virtual for lock status
UserSchema.virtual('isLocked').get(function() {
  return !!(this.lockedUntil && this.lockedUntil > new Date());
});

export default mongoose.model<IUser>('User', UserSchema);
