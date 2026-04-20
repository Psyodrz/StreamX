import express, { Router, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { getSmartShuffleSuggestions } from '../services/aiShuffle';

const router: Router = express.Router();

// Rate limit: 10 requests per minute (Gemini calls are expensive)
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    error: {
      code: 'AI_RATE_LIMIT',
      message: 'Too many AI requests. Please wait a moment.',
    },
  },
});

/**
 * POST /api/v1/ai/smart-shuffle
 * 
 * Body: {
 *   history: [{ title: string, artist: string }],  // last N songs played
 *   count?: number                                   // how many suggestions (default 5)
 * }
 */
router.post('/smart-shuffle', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { history, count = 5 } = req.body;

    if (!history || !Array.isArray(history) || history.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_HISTORY',
          message: 'Please provide a non-empty listening history array.',
        },
      });
    }

    // Validate history entries
    const validHistory = history
      .filter((h: any) => h && typeof h.title === 'string' && typeof h.artist === 'string')
      .slice(-15); // Keep last 15 max

    if (validHistory.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_HISTORY',
          message: 'History entries must have title and artist fields.',
        },
      });
    }

    const suggestions = await getSmartShuffleSuggestions(validHistory, Math.min(count, 10));

    return res.json({
      success: true,
      data: suggestions,
      meta: {
        historySize: validHistory.length,
        suggestionsCount: suggestions.length,
      },
    });
  } catch (error: any) {
    console.error('[AI Route] smart-shuffle error:', error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'AI_ERROR',
        message: error.message || 'Failed to generate suggestions.',
      },
    });
  }
});

// AI Playlists
import { 
  generateDiscoveryPlaylists, 
  generatePersonalizedPlaylists, 
  getCachedAIPlaylist, 
  batchHydrateSongs 
} from '../services/aiPlaylist';

router.get('/playlists/discovery', async (req: Request, res: Response) => {
  try {
    const playlists = await generateDiscoveryPlaylists();
    return res.json({ success: true, data: playlists });
  } catch (error: any) {
    console.error('[AI] /playlists/discovery error:', error.message);
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

router.post('/playlists/personalized', aiLimiter, async (req: Request, res: Response) => {
  try {
    const { history } = req.body;
    if (!history || !Array.isArray(history)) return res.json({ success: true, data: [] });
    // Keep last 15 songs for context
    const validHistory = history.filter(h => h.title && h.artist).slice(-15);
    const playlists = await generatePersonalizedPlaylists(validHistory);
    return res.json({ success: true, data: playlists });
  } catch (error: any) {
    console.error('[AI] /playlists/personalized error:', error.message);
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

router.get('/playlists/:id', async (req: Request, res: Response) => {
  const playlist = await getCachedAIPlaylist(req.params.id);
  if (!playlist) {
    return res.status(404).json({ success: false, error: { message: 'AI Playlist expired or not found' } });
  }
  return res.json({ success: true, data: playlist });
});

router.post('/playlists/hydrate', async (req: Request, res: Response) => {
  try {
    const { tracks } = req.body; // array of { title, artist }
    if (!tracks || !Array.isArray(tracks)) {
      return res.status(400).json({ success: false, error: { message: 'Missing tracks array' } });
    }
    
    // Batch hydrate the requested unhydrated tracks
    const hydrated = await batchHydrateSongs(tracks, 5);
    return res.json({ success: true, data: hydrated });
  } catch (error: any) {
    console.error('[AI] /playlists/hydrate error:', error.message);
    return res.status(500).json({ success: false, error: { message: error.message } });
  }
});

export default router;
