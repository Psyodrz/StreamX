import { Request, Response } from 'express';
import Song from '../models/Song';
import { clearSearchCache } from '../services/search';

export const getSongById = async (req: Request, res: Response) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Song not found.' } });
    }
    res.json({ success: true, data: song });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: error.message } });
  }
};

export const listSongs = async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;
    
    // In a real app we'd add admin checks here if they pass `all=true`
    const songs = await Song.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, data: songs });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: error.message } });
  }
};

export const createSong = async (req: Request, res: Response) => {
  try {
    const song = new Song(req.body);
    await song.save();
    
    // Invalidate search cache down the line since new data is added
    clearSearchCache();

    res.status(201).json({ success: true, data: song });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'CREATE_FAILED', message: error.message } });
  }
};

export const updateSong = async (req: Request, res: Response) => {
  try {
    const song = await Song.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!song) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Song not found.' } });
    }
    
    clearSearchCache();
    
    res.json({ success: true, data: song });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'UPDATE_FAILED', message: error.message } });
  }
};

export const deleteSong = async (req: Request, res: Response) => {
  try {
    const song = await Song.findByIdAndDelete(req.params.id);
    if (!song) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Song not found.' } });
    }

    clearSearchCache();

    res.json({ success: true, data: { message: 'Song deleted successfully.' } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'DELETE_FAILED', message: error.message } });
  }
};
