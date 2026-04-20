import NodeCache from 'node-cache';
import Song, { ISong } from '../models/Song';
import ytSearch from 'yt-search';

// TTL Cache for 5 minutes
const searchCache = new NodeCache({ stdTTL: 5 * 60, checkperiod: 60 });

// ─── Source Type Classification ────────────────────────────────────────────────

export enum SourceType {
  OFFICIAL_AUDIO = 'OFFICIAL_AUDIO',
  LYRIC          = 'LYRIC',
  FILM_VERSION   = 'FILM_VERSION',
  FULL_VIDEO     = 'FULL_VIDEO',
  COVER          = 'COVER',
}

const SOURCE_TYPE_PRIORITY: Record<SourceType, number> = {
  [SourceType.OFFICIAL_AUDIO]: 0,
  [SourceType.LYRIC]:          1,
  [SourceType.FILM_VERSION]:   2,
  [SourceType.FULL_VIDEO]:     3,
  [SourceType.COVER]:          4,
};

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  [SourceType.OFFICIAL_AUDIO]: 'Official Audio',
  [SourceType.LYRIC]:          'Lyric Videos',
  [SourceType.FILM_VERSION]:   'Film / OST Versions',
  [SourceType.FULL_VIDEO]:     'Full Music Videos',
  [SourceType.COVER]:          'Other Versions',
};

/**
 * Classifies a video title into a SourceType tier.
 */
function classifySourceType(title: string): SourceType {
  const t = title.toLowerCase();

  // Tier 1 — Official Audio
  if (
    t.includes('official audio') ||
    t.includes('full audio') ||
    t.includes('audio only') ||
    (t.includes('audio') && !t.includes('video'))
  ) {
    return SourceType.OFFICIAL_AUDIO;
  }

  // Tier 2 — Lyric Videos
  if (
    t.includes('lyric') ||
    t.includes('lyrics') ||
    t.includes('lyrical')
  ) {
    return SourceType.LYRIC;
  }

  // Tier 3 — Film / OST versions
  if (
    t.includes('film version') ||
    t.includes('ost') ||
    t.includes('from the movie') ||
    t.includes('soundtrack') ||
    t.includes('from the film')
  ) {
    return SourceType.FILM_VERSION;
  }

  // Tier 4 — Full Music Videos
  if (
    t.includes('official video') ||
    t.includes('official music video') ||
    t.includes('full video') ||
    t.includes('music video') ||
    t.includes(' mv') ||
    t.endsWith(' mv')
  ) {
    return SourceType.FULL_VIDEO;
  }

  // Tier 5 — Everything else (covers, reprise, fan uploads)
  return SourceType.COVER;
}

// ─── Search ────────────────────────────────────────────────────────────────────

export interface ClassifiedSong {
  _id: string;
  title: string;
  artist: string;
  album: string;
  albumArt: string;
  duration: number;
  language: string;
  genre: string[];
  youtubeVideoId: string;
  playCount: number;
  releaseDate: Date;
  isPublished: boolean;
  sourceType: SourceType;
  sourceTypeLabel: string;
}

export const searchSongs = async (query: string, language?: string, genre?: string, limit: number = 30) => {
  // 1. Check cache
  const cacheKey = `search-${query}-${language || 'all'}-${genre || 'all'}-${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  if (!query) return [];

  let finalResults: ClassifiedSong[] = [];
  try {
    // Append "song" to bias results toward music content
    const ytResults = await ytSearch(`${query} song`);
    
    // Take more results than limit to have a good pool for classification
    const videos = ytResults.videos.slice(0, Math.min(limit * 2, 50));
    
    // 2. Map + Classify
    const classified: ClassifiedSong[] = videos.map(v => {
      const sourceType = classifySourceType(v.title);
      return {
        _id: v.videoId,
        title: v.title,
        artist: v.author.name,
        album: 'YouTube',
        albumArt: v.thumbnail,
        duration: v.seconds,
        language: language || 'Unknown',
        genre: ['Music'],
        youtubeVideoId: v.videoId,
        playCount: v.views,
        releaseDate: new Date(),
        isPublished: true,
        sourceType,
        sourceTypeLabel: SOURCE_TYPE_LABELS[sourceType],
      };
    });

    // 3. Sort by tier priority (OFFICIAL_AUDIO first), then by views within same tier
    classified.sort((a, b) => {
      const tierDiff = SOURCE_TYPE_PRIORITY[a.sourceType] - SOURCE_TYPE_PRIORITY[b.sourceType];
      if (tierDiff !== 0) return tierDiff;
      return (b.playCount || 0) - (a.playCount || 0); // higher views first within same tier
    });

    // 4. Limit to requested amount
    finalResults = classified.slice(0, limit);
    
  } catch (err) {
    console.error("ytSearch error:", err);
    return [];
  }

  searchCache.set(cacheKey, finalResults);
  return finalResults;
};

// ─── Trending ──────────────────────────────────────────────────────────────────

export const getTrendingSongs = async (limit: number = 20) => {
  const cacheKey = `trending-${limit}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  try {
    const ytResults = await ytSearch('trending music hits 2025 2026');
    const videos = ytResults.videos.slice(0, limit);

    const results = videos.map(v => {
      const sourceType = classifySourceType(v.title);
      return {
        _id: v.videoId,
        title: v.title,
        artist: v.author.name,
        album: 'Trending',
        albumArt: v.thumbnail,
        duration: v.seconds,
        language: 'Unknown',
        genre: ['Trending'],
        youtubeVideoId: v.videoId,
        playCount: v.views,
        releaseDate: new Date(),
        isPublished: true,
        sourceType,
        sourceTypeLabel: SOURCE_TYPE_LABELS[sourceType],
      };
    });

    searchCache.set(cacheKey, results);
    return results;
  } catch (err) {
    console.error('getTrendingSongs ytSearch error:', err);
    const results = await Song.find({ isPublished: true })
      .sort({ playCount: -1 })
      .limit(limit)
      .lean();
    searchCache.set(cacheKey, results);
    return results;
  }
};

export const clearSearchCache = () => {
  searchCache.flushAll();
};
