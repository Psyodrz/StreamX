export interface User {
  _id: string;
  email: string;
  displayName: string;
  avatar?: string;
  languagePreferences: string[];
  genrePreferences: string[];
  isPremium: boolean;
  refreshTokenHash?: string;
  loginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Song {
  _id: string;
  title: string;
  artist: string;
  album?: string;
  albumArt?: string;
  duration: number; // in seconds
  language: string;
  genre: string[];
  internalAudioUrl?: string;
  youtubeVideoId?: string;
  playCount: number;
  releaseDate?: Date;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Playlist {
  _id: string;
  ownerId: string;
  name: string;
  description?: string;
  coverImage?: string;
  songs: string[]; // array of Song IDs
  isPublic: boolean;
  shareToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListeningHistory {
  _id: string;
  userId: string;
  songId: string;
  playedAt: Date;
  completionRate: number;
  sourceType: 'internal' | 'youtube';
}

export interface AuthResponse {
  success: boolean;
  data?: {
    user: Partial<User>;
    accessToken: string;
    refreshToken: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface SongListResponse {
  success: boolean;
  data: Song[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface SongResponse {
  success: boolean;
  data: Song;
}

export interface SearchResponse {
  success: boolean;
  data: {
    results: Song[];
    suggestions: { title: string; artist: string }[];
  };
}

export * from './apiClient';
