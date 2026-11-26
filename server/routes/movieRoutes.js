import express from 'express';
import { 
  getMovies, 
  getMovieById, 
  getGenres, 
  syncTMDB, 
  searchLiveTMDB 
} from '../controllers/movieController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getMovies);
router.get('/meta/genres', getGenres);
router.post('/sync-tmdb', protect, authorize('admin'), syncTMDB);
router.get('/search/live', searchLiveTMDB);
router.get('/:id', getMovieById);

export default router;
