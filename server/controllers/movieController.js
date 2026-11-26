import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Movie } from '../models/Movie.js';
import { globalKNNRecommender } from '../utils/knnRecommender.js';
import { 
  fetchMovieByIdFromTMDB, 
  syncCuratedCatalog, 
  searchTMDB 
} from '../services/tmdbService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to fallback to JSON seed if MongoDB has no records yet
const getFallbackMovies = () => {
  try {
    const seedPath = path.resolve(__dirname, '../data/moviesSeed.json');
    return JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  } catch {
    return [];
  }
};

// @desc    Get all movies with filtering, search, sorting & pagination
// @route   GET /api/movies
// @access  Public
export const getMovies = async (req, res, next) => {
  try {
    const rawGenre = typeof req.query.genre === 'string' ? req.query.genre.trim() : undefined;
    const rawLanguage = typeof req.query.language === 'string' ? req.query.language.trim() : undefined;
    const rawMinRating = typeof req.query.minRating === 'string' ? parseFloat(req.query.minRating) : undefined;
    const rawSort = typeof req.query.sort === 'string' ? req.query.sort.trim() : undefined;
    const rawSearch = typeof req.query.search === 'string' ? req.query.search.trim() : undefined;
    const limit = Math.min(5000, Math.max(1, parseInt(req.query.limit) || 100));
    const page = Math.max(1, parseInt(req.query.page) || 1);

    let movies = [];
    let total = 0;

    try {
      const query = {};
      if (rawGenre && rawGenre !== 'All') {
        if (rawGenre === 'Indian Cinema' || rawGenre === 'Hindi' || rawGenre === 'Bollywood') {
          query.$or = [
            { language: { $in: ['hi', 'te', 'ta', 'ml', 'kn'] } },
            { genres: 'Indian Cinema' },
            { similarityKeywords: { $in: ['bollywood', 'india', 'hindi'] } }
          ];
        } else {
          query.genres = rawGenre;
        }
      }
      if (rawLanguage) {
        query.language = rawLanguage;
      }
      if (rawMinRating !== undefined && !isNaN(rawMinRating) && rawMinRating >= 0) {
        query.rating = { $gte: rawMinRating };
      }
      if (rawSearch) {
        const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const safeSearch = escapeRegex(rawSearch);
        const searchRegexList = [
          { title: { $regex: safeSearch, $options: 'i' } },
          { director: { $regex: safeSearch, $options: 'i' } },
          { 'cast.name': { $regex: safeSearch, $options: 'i' } },
          { similarityKeywords: { $regex: safeSearch, $options: 'i' } },
          { genres: { $regex: safeSearch, $options: 'i' } }
        ];

        // Actor Alias expansion (e.g. sharu khan -> Shah Rukh Khan)
        const low = rawSearch.toLowerCase();
        if (low.includes('sharu') || low.includes('srk') || low.includes('shahrukh')) {
          searchRegexList.push({ 'cast.name': { $regex: 'Shah Rukh Khan', $options: 'i' } });
        }
        if (low.includes('aamir') || low.includes('amir')) {
          searchRegexList.push({ 'cast.name': { $regex: 'Aamir Khan', $options: 'i' } });
        }
        if (low.includes('salman')) {
          searchRegexList.push({ 'cast.name': { $regex: 'Salman Khan', $options: 'i' } });
        }
        if (low.includes('amitabh') || low.includes('bachchan')) {
          searchRegexList.push({ 'cast.name': { $regex: 'Amitabh Bachchan', $options: 'i' } });
        }
        if (low.includes('nolan')) {
          searchRegexList.push({ director: { $regex: 'Christopher Nolan', $options: 'i' } });
        }
        if (low.includes('dicaprio') || low.includes('leo')) {
          searchRegexList.push({ 'cast.name': { $regex: 'Leonardo DiCaprio', $options: 'i' } });
        }

        query.$or = searchRegexList;
      }

      let sortOptions = { rating: -1 };
      if (rawSort === 'rating_asc') sortOptions = { rating: 1 };
      if (rawSort === 'year_desc') sortOptions = { year: -1 };
      if (rawSort === 'year_asc') sortOptions = { year: 1 };
      if (rawSort === 'title_asc') sortOptions = { title: 1 };
      if (rawSort === 'popularity') sortOptions = { rating: -1, year: -1 };

      const skip = (parseInt(page) - 1) * parseInt(limit);
      total = await Movie.countDocuments(query);

      // If database is completely empty and no search/genre filter was specified, run automatic initial TMDB sync
      if (total === 0 && !rawSearch && !rawGenre) {
        try {
          const synced = await syncCuratedCatalog();
          total = synced.length;
          movies = await Movie.find(query).sort(sortOptions).skip(skip).limit(limit);
        } catch {
          movies = getFallbackMovies();
          total = movies.length;
        }
      } else {
        movies = await Movie.find(query).sort(sortOptions).skip(skip).limit(limit);
      }
    } catch {
      // Graceful fallback to static JSON
      movies = getFallbackMovies();
      total = movies.length;
    }

    // Ensure recommender is trained on full catalog (not a small paginated slice)
    if (!globalKNNRecommender.isTrained && movies.length > 0) {
      if (movies.length < total) {
        const allForTraining = await Movie.find({}).catch(() => movies);
        globalKNNRecommender.fit(allForTraining.length > 0 ? allForTraining : movies);
      } else {
        globalKNNRecommender.fit(movies);
      }
    }

    res.status(200).json({
      success: true,
      count: movies.length,
      total,
      page: parseInt(page),
      data: movies
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single movie by ID with KNN Similar Movies (with dynamic TMDB fallback)
// @route   GET /api/movies/:id
// @access  Public
export const getMovieById = async (req, res, next) => {
  try {
    const { id } = req.params;
    let movie = null;

    try {
      // First check MongoDB by string id or tmdbId
      const isNum = !isNaN(Number(id));
      if (isNum) {
        movie = await Movie.findOne({ $or: [{ id }, { tmdbId: Number(id) }] });
      } else {
        movie = await Movie.findOne({ id });
      }
    } catch {
      movie = null;
    }

    // Fallback to static seed
    if (!movie) {
      const fallback = getFallbackMovies();
      movie = fallback.find((m) => m.id === id || String(m.tmdbId) === String(id));
    }

    // If still not found and id is numeric or TMDB ID, dynamically fetch from TMDB API!
    if (!movie && !isNaN(Number(id))) {
      movie = await fetchMovieByIdFromTMDB(Number(id));
    }

    if (!movie) {
      return res.status(404).json({
        success: false,
        error: `Movie with id '${id}' not found in database or TMDB`
      });
    }

    // Ensure recommender is trained
    if (!globalKNNRecommender.isTrained) {
      const all = await Movie.find({});
      if (all.length > 0) globalKNNRecommender.fit(all);
    }

    // Get K-Nearest Neighbors for this movie
    const similarMovies = globalKNNRecommender.getKNearestMovies(movie.id, 6);

    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
    res.status(200).json({
      success: true,
      data: movie,
      similarMovies
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all unique genres
// @route   GET /api/movies/meta/genres
// @access  Public
export const getGenres = async (req, res, next) => {
  try {
    let genres = [];
    try {
      genres = await Movie.distinct('genres');
    } catch {
      const fallback = getFallbackMovies();
      const set = new Set();
      fallback.forEach((m) => (m.genres || []).forEach((g) => set.add(g)));
      genres = Array.from(set);
    }

    const sorted = Array.from(new Set(genres)).filter((g) => g && g !== 'All').sort();
    const uniqueGenres = ['All', ...sorted];

    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
    res.status(200).json({
      success: true,
      data: uniqueGenres
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger Curated TMDB Sync
// @route   POST /api/movies/sync-tmdb
// @access  Public
export const syncTMDB = async (req, res, next) => {
  try {
    const syncedMovies = await syncCuratedCatalog();
    res.status(200).json({
      success: true,
      count: syncedMovies.length,
      message: `Successfully synced ${syncedMovies.length} real TMDB movies (Indian & Global) into MongoDB`,
      data: syncedMovies
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Live Search from TMDB API
// @route   GET /api/movies/search/live
// @access  Public
export const searchLiveTMDB = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter "q" is required' });
    }
    const results = await searchTMDB(q);
    res.status(200).json({
      success: true,
      count: results.length,
      data: results
    });
  } catch (error) {
    next(error);
  }
};
