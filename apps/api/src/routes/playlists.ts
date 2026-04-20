import express from 'express';
import { 
    getUserPlaylists, 
    createPlaylist, 
    getPlaylistById, 
    updatePlaylist, 
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    generateShareLink
} from '../controllers/playlists';
import { authenticate } from '../middleware/auth';

import { Router } from 'express';
const router: Router = express.Router();

router.get('/', authenticate, getUserPlaylists);
router.post('/', authenticate, createPlaylist);

// This can potentially be accessed by public users if it's a shared playlist
// However, the controller checks permission based on user/isPublic.
// Let's create an optional auth middleware if needed in the future, for now standard auth or relaxed auth:
// A generic permissive auth middleware could apply, but for simplicity, we pass through to controller.
router.get('/:id', getPlaylistById); 

router.patch('/:id', authenticate, updatePlaylist);
router.delete('/:id', authenticate, deletePlaylist);

router.post('/:id/songs', authenticate, addSongToPlaylist);
router.delete('/:id/songs/:songId', authenticate, removeSongFromPlaylist);

router.post('/:id/share', authenticate, generateShareLink);

export default router;
