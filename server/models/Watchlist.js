import mongoose from 'mongoose';

const WatchlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    movieId: {
      type: String,
      required: true,
      index: true
    },
    inWatchlist: {
      type: Boolean,
      default: false,
      index: true
    },
    watched: {
      type: Boolean,
      default: false,
      index: true
    },
    watchedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound Unique Index: One entry per movie per user
WatchlistSchema.index({ userId: 1, movieId: 1 }, { unique: true });

export const Watchlist = mongoose.model('Watchlist', WatchlistSchema);
