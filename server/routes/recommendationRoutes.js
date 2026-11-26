import express from 'express';
import { getRecommendations, getSimilarToMovie } from '../controllers/recommendationController.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', optionalAuth, getRecommendations);
router.get('/similar/:id', getSimilarToMovie);

export default router;
