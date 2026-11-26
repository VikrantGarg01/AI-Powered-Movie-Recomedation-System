import mongoose from 'mongoose';

const RatingSchema = new mongoose.Schema(
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
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    }
  },
  {
    timestamps: true
  }
);

// Compound Unique Index: One rating per user per movie
RatingSchema.index({ userId: 1, movieId: 1 }, { unique: true });

export const Rating = mongoose.model('Rating', RatingSchema);
