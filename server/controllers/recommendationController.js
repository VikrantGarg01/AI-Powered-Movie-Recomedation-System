import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Movie } from '../models/Movie.js';
import { Rating } from '../models/Rating.js';
import { Watchlist } from '../models/Watchlist.js';
import { globalKNNRecommender } from '../utils/knnRecommender.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to ensure movies are loaded in memory
const ensureRecommenderTrained = async () => {
  if (globalKNNRecommender.isTrained) return;

  let movies = [];
  try {
    movies = await Movie.find({});
  } catch {
    movies = [];
  }

  if (!movies || movies.length === 0) {
    const seedPath = path.resolve(__dirname, '../data/moviesSeed.json');
    movies = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  }

  globalKNNRecommender.fit(movies);
};

// In-memory TTL cache for recommendation responses
const recsCache = new Map();
const RECS_CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes

const getCacheKey = (userId, genres, watched, ratings, mode, k) => {
  const gStr = (genres || []).slice().sort().join(',');
  const wStr = (watched || []).slice().sort().join(',');
  const rKeys = Object.keys(ratings || {}).sort().map(k => `${k}:${ratings[k]}`).join(',');
  return `${userId || 'anon'}_${mode}_${k}_g[${gStr}]_w[${wStr}]_r[${rKeys}]`;
};

// @desc    Get High-Accuracy Personalized KNN Recommendations
// @route   POST /api/recommendations
// @access  Public (Optional auth for personalization)
export const getRecommendations = async (req, res, next) => {
  try {
    await ensureRecommenderTrained();

    const {
      favoriteGenres = [],
      watchedMovieIds = [],
      userRatings = {},
      algorithmMode = 'hybrid',
      k = 10,
      metric = 'cosine'
    } = req.body;

    // If user is authenticated, merge database ratings and watchlist
    let effectiveWatched = [...watchedMovieIds];
    let effectiveRatings = { ...userRatings };
    let effectiveGenres = [...favoriteGenres];

    if (req.user) {
      try {
        const dbWatchlist = await Watchlist.find({ userId: req.user._id });
        const dbWatchedIds = dbWatchlist.filter(w => w.watched).map(w => w.movieId);
        effectiveWatched = Array.from(new Set([...effectiveWatched, ...dbWatchedIds]));

        const dbRatings = await Rating.find({ userId: req.user._id });
        dbRatings.forEach(r => {
          effectiveRatings[r.movieId] = r.rating;
        });

        if (req.user.favoriteGenres && req.user.favoriteGenres.length > 0) {
          effectiveGenres = Array.from(new Set([...effectiveGenres, ...req.user.favoriteGenres]));
        }
      } catch {
        // Continue with client-provided preferences
      }
    }

    const cacheKey = getCacheKey(
      req.user?._id?.toString(),
      effectiveGenres,
      effectiveWatched,
      effectiveRatings,
      algorithmMode,
      k
    );

    const now = Date.now();
    const cached = recsCache.get(cacheKey);
    if (cached && now - cached.timestamp < RECS_CACHE_TTL_MS) {
      return res.status(200).json(cached.payload);
    }

    const recommendations = globalKNNRecommender.getPersonalizedRecommendations({
      favoriteGenres: effectiveGenres,
      watchedMovieIds: effectiveWatched,
      userRatings: effectiveRatings,
      algorithmMode,
      k: parseInt(k) || 10,
      metric
    });

    const payload = {
      success: true,
      count: recommendations.length,
      k: parseInt(k) || 10,
      algorithmMode,
      metric,
      data: recommendations
    };

    recsCache.set(cacheKey, { timestamp: now, payload });

    // Prune cache if exceeds 500 entries
    if (recsCache.size > 500) {
      const oldestKey = recsCache.keys().next().value;
      recsCache.delete(oldestKey);
    }

    res.status(200).json(payload);
  } catch (error) {
    next(error);
  }
};

// @desc    Get K-Nearest Neighbors for a specific Movie ID
// @route   GET /api/recommendations/similar/:id
// @access  Public
export const getSimilarToMovie = async (req, res, next) => {
  try {
    await ensureRecommenderTrained();
    const { id } = req.params;
    const { k = 6 } = req.query;

    const similar = globalKNNRecommender.getKNearestMovies(id, parseInt(k));

    res.status(200).json({
      success: true,
      targetMovieId: id,
      k: parseInt(k),
      data: similar
    });
  } catch (error) {
    next(error);
  }
};
