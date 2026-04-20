import { Request, Response } from 'express';
import Playlist from '../models/Playlist';
import crypto from 'crypto';

export const getUserPlaylists = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const playlists = await Playlist.find({ ownerId: userId }).sort({ updatedAt: -1 });
    
    res.json({ success: true, data: playlists });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: error.message } });
  }
};

export const createPlaylist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, description, isPublic } = req.body;
    
    const playlist = new Playlist({
      ownerId: userId,
      name,
      description,
      isPublic: isPublic || false,
    });
    
    await playlist.save();
    res.status(201).json({ success: true, data: playlist });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'CREATE_FAILED', message: error.message } });
  }
};

export const getPlaylistById = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id; // Optional if public
    const playlist = await Playlist.findById(req.params.id).populate('songs');
    
    if (!playlist) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Playlist not found.' } });
    }
    
    // Check permission
    if (!playlist.isPublic && String(playlist.ownerId) !== userId) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
    }

    res.json({ success: true, data: playlist });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'FETCH_FAILED', message: error.message } });
  }
};

export const updatePlaylist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, description, coverImage, isPublic } = req.body;
    
    const playlist = await Playlist.findOneAndUpdate(
      { _id: req.params.id, ownerId: userId },
      { name, description, coverImage, isPublic },
      { new: true }
    );
    
    if (!playlist) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Playlist not found or unauthorized.' } });

    res.json({ success: true, data: playlist });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'UPDATE_FAILED', message: error.message } });
  }
};

export const deletePlaylist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const playlist = await Playlist.findOneAndDelete({ _id: req.params.id, ownerId: userId });
    
    if (!playlist) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Playlist not found or unauthorized.' } });

    res.json({ success: true, data: { message: 'Playlist deleted.' } });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'DELETE_FAILED', message: error.message } });
  }
};

export const addSongToPlaylist = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { songId } = req.body;
    
    const playlist = await Playlist.findOneAndUpdate(
      { _id: req.params.id, ownerId: userId },
      { $addToSet: { songs: songId } }, // Prevent duplicates using $addToSet
      { new: true }
    );
    
    if (!playlist) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Playlist not found.' } });

    res.json({ success: true, data: playlist });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'ADD_SONG_FAILED', message: error.message } });
  }
};

export const removeSongFromPlaylist = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.id;
      const { songId } = req.params;
      
      const playlist = await Playlist.findOneAndUpdate(
        { _id: req.params.id, ownerId: userId },
        { $pull: { songs: songId } },
        { new: true }
      );
      
      if (!playlist) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Playlist not found.' } });
  
      res.json({ success: true, data: playlist });
    } catch (error: any) {
      res.status(500).json({ success: false, error: { code: 'REMOVE_SONG_FAILED', message: error.message } });
    }
  };

export const generateShareLink = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.id;
        
        const playlist = await Playlist.findOne({ _id: req.params.id, ownerId: userId });
        if (!playlist) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Playlist not found.' } });

        // Generate a random token
        const shareToken = crypto.randomBytes(16).toString('hex');
        
        playlist.shareToken = shareToken;
        playlist.isPublic = true; 
        await playlist.save();

        res.json({ success: true, data: { shareToken, url: `/playlist/${shareToken}` } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { code: 'SHARE_FAILED', message: error.message } });
    }
};
