import Groq from 'groq-sdk';
import ytSearch from 'yt-search';
import NodeCache from 'node-cache';
import { ClassifiedSong, SourceType } from './search';

const cache = new NodeCache({ stdTTL: 3 * 60, checkperiod: 60 });

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

interface HistoryEntry {
  title: string;
  artist: string;
}

interface AISuggestion {
  title: string;
  artist: string;
}

/**
 * AI Smart Shuffle — analyzes listening history and suggests next songs.
 * 
 * The prompt is designed to:
 * 1. Detect the user's current mood/vibe from their recent listening pattern
 * 2. Notice mood shifts (e.g., lofi → rock → romantic)
 * 3. Predict what the user will likely want to hear next
 * 4. Return diverse but cohesive suggestions
 */
export async function getSmartShuffleSuggestions(
  history: HistoryEntry[],
  count: number = 5
): Promise<ClassifiedSong[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not set in environment variables');
  }

  // Cache key based on the last few songs
  const historyKey = history.map(h => `${h.title}-${h.artist}`).join('|');
  const cacheKey = `smart-shuffle-${historyKey}-${count}`;
  const cached = cache.get<ClassifiedSong[]>(cacheKey);
  if (cached) return cached;

  // ── Step 1: Ask Groq to analyze listening pattern and suggest songs ──
  const groq = new Groq({ apiKey });

  const historyText = history
    .map((h, i) => `${i + 1}. "${h.title}" by ${h.artist}`)
    .join('\n');

  const prompt = `You are a music recommendation AI for a streaming app. Analyze the user's recent listening history and predict what they'll want to hear next.

LISTENING HISTORY (most recent last):
${historyText}

INSTRUCTIONS:
1. Detect the current mood/vibe pattern from the songs above
2. If there's a mood shift (e.g., started calm then moved to energetic), follow the LATEST direction
3. Suggest ${count} songs that naturally continue the vibe
4. Mix well-known and lesser-known tracks for discovery
5. Do NOT repeat any songs already in the history
6. Include songs from different artists for variety
7. Consider the language/region of the songs — if user listens to Hindi songs, suggest more Hindi songs; if English, suggest English, etc.

RESPOND WITH ONLY a valid JSON array, no markdown, no explanation:
[{"title": "Song Name", "artist": "Artist Name"}, ...]`;

  let suggestions: AISuggestion[] = [];

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }]
    });
    
    const text = response.choices[0]?.message?.content?.trim() || '';
    
    // Strip markdown code fences if present
    const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    suggestions = JSON.parse(jsonStr);

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      throw new Error('Groq returned invalid format');
    }
  } catch (err: any) {
    console.error('[SmartShuffle] Groq error:', err.message);
    // Fallback: use the last song's artist/genre for a basic YouTube search
    if (history.length > 0) {
      const lastSong = history[history.length - 1];
      const fallbackResults = await ytSearch(`${lastSong.artist} songs similar to ${lastSong.title}`);
      const videos = fallbackResults.videos.slice(0, count);
      return videos.map(v => ({
        _id: v.videoId,
        title: v.title,
        artist: v.author.name,
        album: 'Smart Shuffle',
        albumArt: v.thumbnail,
        duration: v.seconds,
        language: 'Unknown',
        genre: ['Smart Shuffle'],
        youtubeVideoId: v.videoId,
        playCount: v.views,
        releaseDate: new Date(),
        isPublished: true,
        sourceType: classifySourceType(v.title),
        sourceTypeLabel: SOURCE_TYPE_LABELS[classifySourceType(v.title)],
      }));
    }
    return [];
  }

  // ── Step 2: Search YouTube for each suggestion ──
  const results: ClassifiedSong[] = [];

  // Search in parallel for speed
  const searchPromises = suggestions.slice(0, count).map(async (suggestion) => {
    try {
      const query = `${suggestion.title} ${suggestion.artist} official audio`;
      const ytResults = await ytSearch(query);
      const video = ytResults.videos[0]; // Best match
      
      if (!video) return null;

      const sourceType = classifySourceType(video.title);
      return {
        _id: video.videoId,
        title: video.title,
        artist: video.author.name,
        album: 'Smart Shuffle',
        albumArt: video.thumbnail,
        duration: video.seconds,
        language: 'Unknown',
        genre: ['Smart Shuffle'],
        youtubeVideoId: video.videoId,
        playCount: video.views,
        releaseDate: new Date(),
        isPublished: true,
        sourceType,
        sourceTypeLabel: SOURCE_TYPE_LABELS[sourceType],
        // Include the AI's original suggestion for display
        _aiSuggestion: { title: suggestion.title, artist: suggestion.artist },
      } as ClassifiedSong & { _aiSuggestion: AISuggestion };
    } catch (err) {
      console.error(`[SmartShuffle] yt-search failed for "${suggestion.title}":`, err);
      return null;
    }
  });

  const searchResults = await Promise.all(searchPromises);
  for (const r of searchResults) {
    if (r) results.push(r);
  }

  // Cache for 3 minutes
  if (results.length > 0) {
    cache.set(cacheKey, results);
  }

  return results;
}
