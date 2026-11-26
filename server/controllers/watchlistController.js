import { Watchlist } from '../models/Watchlist.js';
import { Rating } from '../models/Rating.js';

// @desc    Get user's watchlist and watched history
// @route   GET /api/watchlist
// @access  Private
export const getWatchlist = async (req, res, next) => {
  try {
    const items = await Watchlist.find({ userId: req.user._id });
    // Strictly return only items explicitly added to watchlist with String IDs
    const watchlistIds = items.filter(i => i.inWatchlist === true).map(i => String(i.movieId));
    const watchedIds = items.filter(i => i.watched === true).map(i => String(i.movieId));

    const ratings = await Rating.find({ userId: req.user._id });
    const ratingsMap = {};
    ratings.forEach(r => {
      ratingsMap[String(r.movieId)] = r.rating;
    });

    res.status(200).json({
      success: true,
      data: {
        watchlist: watchlistIds,
        watched: watchedIds,
        userRatings: ratingsMap
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add or remove movie from watchlist
// @route   POST /api/watchlist/toggle
// @access  Private
export const toggleWatchlist = async (req, res, next) => {
  try {
    const { movieId } = req.body;
    if (!movieId) {
      return res.status(400).json({ success: false, error: 'Movie ID required' });
    }

    const strMovieId = String(movieId).trim();
    let entry = await Watchlist.findOne({ userId: req.user._id, movieId: strMovieId });
    if (entry) {
      entry.inWatchlist = !entry.inWatchlist;
      // If no longer in watchlist and not watched, delete document
      if (!entry.inWatchlist && !entry.watched) {
        await Watchlist.deleteOne({ _id: entry._id });
      } else {
        await entry.save();
      }
      return res.status(200).json({
        success: true,
        action: entry.inWatchlist ? 'added' : 'removed',
        movieId: strMovieId
      });
    } else {
      await Watchlist.create({
        userId: req.user._id,
        movieId: strMovieId,
        inWatchlist: true,
        watched: false
      });
      return res.status(201).json({
        success: true,
        action: 'added',
        movieId: strMovieId
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle watched status of a movie
// @route   POST /api/watchlist/watched
// @access  Private
export const toggleWatched = async (req, res, next) => {
  try {
    const { movieId } = req.body;
    if (!movieId) {
      return res.status(400).json({ success: false, error: 'Movie ID required' });
    }

    const strMovieId = String(movieId).trim();
    let entry = await Watchlist.findOne({ userId: req.user._id, movieId: strMovieId });
    if (!entry) {
      // Marked as watched only, NOT added to watchlist
      entry = await Watchlist.create({
        userId: req.user._id,
        movieId: strMovieId,
        inWatchlist: false,
        watched: true,
        watchedAt: new Date()
      });
    } else {
      entry.watched = !entry.watched;
      entry.watchedAt = entry.watched ? new Date() : null;
      if (!entry.inWatchlist && !entry.watched) {
        await Watchlist.deleteOne({ _id: entry._id });
      } else {
        await entry.save();
      }
    }

    res.status(200).json({
      success: true,
      movieId: strMovieId,
      watched: entry.watched
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit or update user rating for a movie
// @route   POST /api/ratings
// @access  Private
export const submitRating = async (req, res, next) => {
  try {
    const { movieId, rating } = req.body;
    if (!movieId || rating === undefined) {
      return res.status(400).json({ success: false, error: 'movieId and rating required' });
    }

    const strMovieId = String(movieId).trim();
    const numRating = Number(rating);
    if (isNaN(numRating) || !isFinite(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Invalid rating. Rating must be a valid number between 1 and 5'
      });
    }

    const updated = await Rating.findOneAndUpdate(
      { userId: req.user._id, movieId: strMovieId },
      { rating: numRating },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Also mark as watched automatically (without adding to watchlist)
    let watchEntry = await Watchlist.findOne({ userId: req.user._id, movieId: strMovieId });
    if (!watchEntry) {
      await Watchlist.create({
        userId: req.user._id,
        movieId: strMovieId,
        inWatchlist: false,
        watched: true,
        watchedAt: new Date()
      });
    } else if (!watchEntry.watched) {
      watchEntry.watched = true;
      watchEntry.watchedAt = new Date();
      await watchEntry.save();
    }

    res.status(200).json({
      success: true,
      movieId: strMovieId,
      rating: updated.rating
    });
  } catch (error) {
    next(error);
  }
};
