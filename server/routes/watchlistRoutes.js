import express from 'express';
import { getWatchlist, toggleWatchlist, toggleWatched, submitRating } from '../controllers/watchlistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getWatchlist);
router.post('/toggle', toggleWatchlist);
router.post('/watched', toggleWatched);
router.post('/rate', submitRating);

export default router;
