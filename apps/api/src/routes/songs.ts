import express, { Router } from 'express';
import { getSongById, listSongs, createSong, updateSong, deleteSong } from '../controllers/songs';
import { authenticate } from '../middleware/auth';

const router: Router = express.Router();

router.get('/', listSongs);
router.get('/:id', getSongById);

// In a real application, these should definitely have admin-only middleware
router.post('/', authenticate, createSong);
router.patch('/:id', authenticate, updateSong);
router.delete('/:id', authenticate, deleteSong);

export default router;
