import { Request, Response } from 'express';
import History from '../models/History';
import Song from '../models/Song';

export const logPlay = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const songId = req.params.id;
    const { completionRate, sourceType } = req.body;

    // Validate song exists
    const song = await Song.findById(songId);
    if (!song) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Song not found.' } });
    }

    // Update play count (simple increment, real-world might batch this)
    await Song.findByIdAndUpdate(songId, { $inc: { playCount: 1 } });

    // Log history
    const historyEntry = new History({
      userId,
      songId,
      completionRate: completionRate || 0,
      sourceType: sourceType || 'internal',
    });

    await historyEntry.save();

    res.status(201).json({ success: true, data: historyEntry });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'LOG_FAILED', message: error.message } });
  }
};

export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const limit = parseInt(req.query.limit as string) || 50;

    const history = await History.find({ userId })
      .sort({ playedAt: -1 })
      .limit(limit)
      .populate('songId');

    // Filter unique songs (get recently played distinct songs)
    const uniqueHistory: any[] = [];
    const seenSongs = new Set();
    
    for (const h of history) {
        const songObjId = String((h.songId as any)?._id || h.songId);
        if(!seenSongs.has(songObjId)){
            seenSongs.add(songObjId);
            uniqueHistory.push(h);
        }
    }

    res.json({ success: true, data: uniqueHistory });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: error.message } });
  }
};
