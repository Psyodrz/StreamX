import { Request, Response } from 'express';
import { searchSongs, getTrendingSongs } from '../services/search';

export const search = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string || '';
    const language = req.query.lang as string;
    const genre = req.query.genre as string;
    const limit = parseInt(req.query.limit as string) || 20;

    const results = await searchSongs(query, language, genre, limit);

    res.json({
      success: true,
      data: results
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SEARCH_FAILED', message: error.message } });
  }
};

export const suggest = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string || '';
    if (query.length < 2) {
      return res.json({ success: true, data: [] });
    }

    // Reuse the search service with a smaller limit
    const results = await searchSongs(query, undefined, undefined, 5) as any[];
    
    // For suggestions, we usually just return titles or basic metadata
    const suggestions = results.map((r: any) => ({ title: r.title, artist: r.artist }));

    res.json({ success: true, data: suggestions });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SUGGEST_FAILED', message: error.message } });
  }
};

export const trending = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const results = await getTrendingSongs(limit);

    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'TRENDING_FAILED', message: error.message } });
  }
};
