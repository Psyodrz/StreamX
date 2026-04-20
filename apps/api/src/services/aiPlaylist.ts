import Groq from 'groq-sdk';
import ytSearch from 'yt-search';
import NodeCache from 'node-cache';
import { ClassifiedSong, SourceType } from './search';
import SystemCache from '../models/SystemCache';

const playlistCache = new NodeCache({ stdTTL: 30 * 60, checkperiod: 120 });

const SOURCE_TYPE_LABELS: Record<SourceType, string> = {
  [SourceType.OFFICIAL_AUDIO]: 'Official Audio',
  [SourceType.LYRIC]:          'Lyric Videos',
  [SourceType.FILM_VERSION]:   'Film / OST Versions',
  [SourceType.FULL_VIDEO]:     'Full Music Videos',
  [SourceType.COVER]:          'Other Versions',
};

function classifySourceType(title: string): SourceType {
  const t = title.toLowerCase();
  if (t.includes('official audio') || t.includes('full audio') || (t.includes('audio') && !t.includes('video'))) return SourceType.OFFICIAL_AUDIO;
  if (t.includes('lyric') || t.includes('lyrics') || t.includes('lyrical')) return SourceType.LYRIC;
  if (t.includes('film version') || t.includes('ost') || t.includes('soundtrack')) return SourceType.FILM_VERSION;
  if (t.includes('official video') || t.includes('music video') || t.includes('full video')) return SourceType.FULL_VIDEO;
  return SourceType.COVER;
}

interface AISuggestion {
  title: string;
  artist: string;
}

export type AIPlaylistTrack = ClassifiedSong | { title: string; artist: string; unhydrated: true };

export interface AIPlaylist {
  id: string;
  name: string;
  description: string;
  coverQuery: string; // used to fetch a thumbnail
  songs: AIPlaylistTrack[];
  type: 'mood' | 'artist' | 'era' | 'personalized' | 'trending';
}

/**
 * Searches YouTube for a single song and returns a ClassifiedSong.
 */
export async function hydrateSong(suggestion: AISuggestion): Promise<ClassifiedSong | null> {
  try {
    const query = `${suggestion.title} ${suggestion.artist} song`;
    const results = await ytSearch(query);
    const video = results.videos[0];
    if (!video) return null;

    const sourceType = classifySourceType(video.title);
    return {
      _id: video.videoId,
      title: video.title,
      artist: video.author.name,
      album: 'AI Playlist',
      albumArt: video.thumbnail,
      duration: video.seconds,
      language: 'Unknown',
      genre: ['AI Curated'],
      youtubeVideoId: video.videoId,
      playCount: video.views,
      releaseDate: new Date(),
      isPublished: true,
      sourceType,
      sourceTypeLabel: SOURCE_TYPE_LABELS[sourceType],
    };
  } catch {
    return null;
  }
}

/**
 * Batch searches multiple songs, capping concurrency to prevent rate limiting.
 */
export async function batchHydrateSongs(suggestions: AISuggestion[], concurrency: number = 5): Promise<ClassifiedSong[]> {
  const results: ClassifiedSong[] = [];
  for (let i = 0; i < suggestions.length; i += concurrency) {
    const batch = suggestions.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(hydrateSong));
    for (const r of batchResults) {
      if (r) results.push(r);
    }
  }
  return results;
}

/**
 * Generate default discovery playlists (mood, artist, era based).
 * Returns unhydrated songs (except the first one for the cover).
 */
export async function generateDiscoveryPlaylists(): Promise<AIPlaylist[]> {
  const cacheKey = 'discovery-playlists';

  // Check in-memory cache first
  const cachedMemory = playlistCache.get<AIPlaylist[]>(cacheKey);
  if (cachedMemory) return cachedMemory;

  // Check MongoDB cache
  try {
    const cachedDB = await SystemCache.findOne({ key: cacheKey });
    if (cachedDB && cachedDB.data && Array.isArray(cachedDB.data) && cachedDB.data.length > 0) {
      playlistCache.set(cacheKey, cachedDB.data);
      return cachedDB.data;
    }
  } catch (err) {
    console.error('[AIPlaylist] MongoDB cache read failed:', err);
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set');
  }

  const groq = new Groq({ apiKey });

  const PLAYLIST_DEFINITIONS = [
    { id: 'chill-vibes', name: 'Chill Vibes', type: 'mood', prompt: 'relaxing, lo-fi, ambient, acoustic songs (mix of Hindi & English)' },
    { id: 'party-bangers', name: 'Party Bangers', type: 'mood', prompt: 'high-energy dance, EDM, Bollywood party hits' },
    { id: 'best-of-arijit', name: 'Best of Arijit Singh', type: 'artist', prompt: 'top songs by Arijit Singh' },
    { id: 'global-top-40', name: 'Global Top 40', type: 'trending', prompt: 'the absolute latest trending global pop & hip-hop hits right now' },
    { id: '2020s-hits', name: '2020s Hits', type: 'era', prompt: 'biggest songs from 2020–2025' },
    { id: '2000s-nostalgia', name: '2000s Nostalgia', type: 'era', prompt: 'iconic songs from 2000–2009' }
  ];

  try {
    const rawPlaylists = [];
    for (const def of PLAYLIST_DEFINITIONS) {
      const prompt = `You are a music curator AI. Generate EXACTLY ONE curated playlist.
Name: "${def.name}"
Theme: ${def.prompt}

Provide exactly 20 songs. Output ONLY raw valid JSON, no markdown, no explanation.
{"id":"${def.id}","name":"${def.name}","description":"short description","type":"${def.type}","songs":[{"title":"Song Name","artist":"Artist Name"}]}`;

      let parsed = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          const response = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 2000,
            temperature: 0.7
          });

          const text = response.choices[0]?.message?.content?.trim() || '';
          const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          parsed = JSON.parse(jsonStr);
          break; // Success
        } catch (parseErr: any) {
          console.log(`[AIPlaylist] Attempt ${attempt + 1}/3 for "${def.name}" failed: ${parseErr.message}`);
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }

      if (parsed) {
        rawPlaylists.push(parsed);
        console.log(`[AIPlaylist] ✅ Generated "${def.name}" with ${parsed.songs?.length || 0} songs`);
      } else {
        console.error(`[AIPlaylist] ❌ Skipped "${def.name}" after 3 failed attempts`);
      }
      
      // Delay to stay under Groq free-tier rate limits
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    const playlists: AIPlaylist[] = [];

    for (const pl of rawPlaylists) {
      if (!pl.songs || !Array.isArray(pl.songs)) continue;
      const rawSongs: AISuggestion[] = pl.songs;
      if (rawSongs.length === 0) continue;

      console.log(`[AIPlaylist] Hydrating cover track for "${pl.name}"...`);
      
      // OPTIMIZED: Fully hydrate ONLY the first song for the cover image
      // Other songs are left as unhydrated to prevent 5-minute boot times
      const coverSong = await hydrateSong(rawSongs[0]);
      
      const tracks: AIPlaylistTrack[] = [
        ...(coverSong ? [coverSong] : []),
        ...rawSongs.slice(coverSong ? 1 : 0).map(s => ({ ...s, unhydrated: true as const }))
      ];

      if (tracks.length > 0) {
         playlists.push({
          id: pl.id || pl.name.toLowerCase().replace(/\s+/g, '-'),
          name: pl.name,
          description: pl.description || '',
          coverQuery: coverSong?.albumArt || '',
          songs: tracks,
          type: pl.type || 'mood',
        });
        console.log(`[AIPlaylist] ✅ "${pl.name}" ready with ${tracks.length} tracks (1 hydrated)`);
      }
    }

    if (playlists.length > 0) {
      playlistCache.set(cacheKey, playlists);
      // Persist to MongoDB instead of local ephemeral file
      await SystemCache.findOneAndUpdate(
        { key: cacheKey },
        { data: playlists },
        { upsert: true, new: true }
      );
    }

    return playlists;
  } catch (err: any) {
    console.error('[AIPlaylist] Discovery generation error:', err.message);
    return [];
  }
}

/**
 * Generate personalized playlists based on user's listening history.
 */
export async function generatePersonalizedPlaylists(
  history: { title: string; artist: string }[]
): Promise<AIPlaylist[]> {
  if (history.length < 3) return [];

  const historyKey = history.slice(-10).map(h => h.title).join('|');
  const cacheKey = `personalized-${historyKey}`;
  const cached = playlistCache.get<AIPlaylist[]>(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set');
  }

  const groq = new Groq({ apiKey });

  const historyText = history.slice(-15).map((h, i) => `${i + 1}. "${h.title}" by ${h.artist}`).join('\n');

  const prompt = `Based on this user's recent listening history, create 3 personalized playlists:

LISTENING HISTORY:
${historyText}

Create:
1. "Your Mix" — 45 songs similar to what they've been listening to
2. "Discover Weekly" — 45 songs they haven't heard but would love based on their taste
3. A playlist named after the dominant artist/genre pattern — 45 songs (e.g., "More Bollywood Romance" or "Indie Rock Deep Cuts")

RESPOND WITH ONLY valid JSON, no markdown.
{
  "playlists": [
    {
      "id": "your-mix",
      "name": "Your Mix",
      "description": "Short description (max 15 words)",
      "type": "personalized",
      "songs": [{"title": "...", "artist": "..."}, ...]
    }
  ]
}`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }]
    });

    const text = response.choices[0]?.message?.content?.trim() || '';
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    const playlists: AIPlaylist[] = [];

    for (const pl of parsed.playlists) {
      const rawSongs: AISuggestion[] = pl.songs || [];
      if (rawSongs.length === 0) continue;

      // Hydrate ONLY the first song to get the cover image
      const coverSong = await hydrateSong(rawSongs[0]);
      
      const tracks: AIPlaylistTrack[] = [
        ...(coverSong ? [coverSong] : []),
        ...rawSongs.slice(coverSong ? 1 : 0).map(s => ({ ...s, unhydrated: true as const }))
      ];

      if (tracks.length > 0) {
        playlists.push({
          id: pl.id || pl.name.toLowerCase().replace(/\s+/g, '-'),
          name: pl.name,
          description: pl.description || '',
          coverQuery: coverSong?.albumArt || '',
          songs: tracks,
          type: 'personalized',
        });
      }
    }

    if (playlists.length > 0) {
      playlistCache.set(cacheKey, playlists);
    }

    return playlists;
  } catch (err: any) {
    console.error('[AIPlaylist] Personalized generation error:', err.message);
    return [];
  }
}

/**
 * Fetch a cached playlist by ID. 
 * Because the home page generated them, they should be in the cache.
 */
export async function getCachedAIPlaylist(id: string): Promise<AIPlaylist | null> {
  const keys = playlistCache.keys();
  for (const key of keys) {
    const lists = playlistCache.get<AIPlaylist[]>(key);
    if (lists) {
      const found = lists.find(p => p.id === id);
      if (found) return found;
    }
  }
  
  // Check MongoDB if cache missed
  try {
    const cachedDB = await SystemCache.findOne({ key: 'discovery-playlists' });
    if (cachedDB && cachedDB.data && Array.isArray(cachedDB.data)) {
      const found = cachedDB.data.find((p: any) => p.id === id);
      if (found) {
        // Hydrate this playlist into memory for next time
        playlistCache.set('discovery-playlists', cachedDB.data);
        return found;
      }
    }
  } catch (err) {
    console.error('[AIPlaylist] MongoDB fallback check failed:', err);
  }

  return null;
}

/**
 * Incrementally mutates the cached "Trending" playlist without calling Groq.
 * Injects 5 fresh real-world trending tracks and drops the 5 oldest.
 */
export async function autoUpdateTrendingPlaylists() {
  const cacheKey = 'discovery-playlists';

  try {
    let playlists: AIPlaylist[] = [];
    const cachedDB = await SystemCache.findOne({ key: cacheKey });
    
    if (cachedDB && cachedDB.data) {
      playlists = cachedDB.data;
    }

    if (playlists.length === 0) return;

    const trendingIndex = playlists.findIndex(pl => pl.type === 'trending' || pl.name.toLowerCase().includes('trending'));
    if (trendingIndex === -1) return;

    const trendingPl = playlists[trendingIndex];
    // Fetch 5 actual trending global tracks
    const newHits = await ytSearch('latest trending music global hits video 2026');
    const videoHits = newHits.videos.slice(0, 5);

    if (videoHits.length === 0) return;

    // Remove the first 5 old tracks to maintain 45 count
    if (trendingPl.songs.length >= 45) {
       trendingPl.songs = trendingPl.songs.slice(5); 
    }

    for (const v of videoHits) {
       const st = classifySourceType(v.title);
       const track: AIPlaylistTrack = {
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
         sourceType: st,
         sourceTypeLabel: SOURCE_TYPE_LABELS[st],
       };
       trendingPl.songs.push(track);
    }

    playlists[trendingIndex] = trendingPl;
    
    // Update MongoDB
    await SystemCache.findOneAndUpdate({ key: cacheKey }, { data: playlists }, { upsert: true });
    playlistCache.set(cacheKey, playlists);
    
    console.log('[AIPlaylist] Automatically rotated 5 songs in the Trending playlist.');
  } catch (err: any) {
     console.error('[AIPlaylist] Auto-update failed:', err.message);
  }
}
